'use server'

import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { Database } from '@/types/database.types'
import {
  checkAuthenticated,
  checkUserTeamAuthorization,
  getUserAccessToken,
  guard,
} from '@/lib/utils/server'
import { z } from 'zod'
import {
  E2BError,
  InvalidParametersError,
  UnauthorizedError,
} from '@/types/errors'
import { kv } from '@vercel/kv'
import { KV_KEYS } from '@/configs/keys'
import { revalidatePath } from 'next/cache'
import { uploadFile, deleteFile, bucket } from '@/lib/clients/storage'

// Update team name

const UpdateTeamNameSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1),
})

export const updateTeamNameAction = guard(
  UpdateTeamNameSchema,
  async ({ teamId, name }) => {
    const { user } = await checkAuthenticated()

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

    if (!isAuthorized) {
      throw UnauthorizedError('User is not authorized to update this team')
    }

    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({ name })
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      throw new E2BError(error.message, 'Failed to update team name')
    }

    return data
  }
)

// Add team member

const AddTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
})

export const addTeamMemberAction = guard(
  AddTeamMemberSchema,
  async ({ teamId, email }) => {
    const { user } = await checkAuthenticated()

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

    if (!isAuthorized) {
      throw UnauthorizedError('User is not authorized to add a team member')
    }

    const { data: existingUsers, error: userError } = await supabaseAdmin
      .from('auth_users')
      .select('*')
      .eq('email', email)

    if (userError) {
      throw userError
    }

    const existingUser = existingUsers?.[0]

    if (!existingUser) {
      throw InvalidParametersError(
        'User with this email does not exist. Account must be registered first.'
      )
    }

    const { data: existingTeamMember } = await supabaseAdmin
      .from('users_teams')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', existingUser.id!)
      .single()

    if (existingTeamMember) {
      throw InvalidParametersError('User is already a member of this team')
    }

    const { error: insertError } = await supabaseAdmin
      .from('users_teams')
      .insert({
        team_id: teamId,
        user_id: existingUser.id!,
        added_by: user.id,
      })

    if (insertError) {
      throw insertError
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/general`, 'page')

    await kv.del(KV_KEYS.USER_TEAM_ACCESS(user.id, teamId))
  }
)

// Remove team member

const RemoveTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
})

export const removeTeamMemberAction = guard(
  RemoveTeamMemberSchema,
  async ({ teamId, userId }) => {
    const { user } = await checkAuthenticated()

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

    if (!isAuthorized) {
      throw UnauthorizedError('User is not authorized to remove team members')
    }

    const { data: teamMemberData, error: teamMemberError } = await supabaseAdmin
      .from('users_teams')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (teamMemberError || !teamMemberData || teamMemberData.length === 0) {
      throw InvalidParametersError('User is not a member of this team')
    }

    const teamMember = teamMemberData[0]

    if (teamMember.user_id !== user.id && teamMember.is_default) {
      throw InvalidParametersError('Cannot remove a default team member')
    }

    const { count, error: countError } = await supabaseAdmin
      .from('users_teams')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)

    if (countError) {
      throw countError
    }

    if (count === 1) {
      throw InvalidParametersError('Cannot remove the last team member')
    }

    const { error: removeError } = await supabaseAdmin
      .from('users_teams')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (removeError) {
      throw removeError
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/general`, 'page')

    await kv.del(KV_KEYS.USER_TEAM_ACCESS(user.id, teamId))
  }
)

const CreateTeamSchema = z.object({
  name: z.string().min(1),
})

export const createTeamAction = guard(CreateTeamSchema, async ({ name }) => {
  const { user } = await checkAuthenticated()

  const accessToken = await getUserAccessToken(user.id)

  const response = await fetch(`${process.env.BILLING_API_URL}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Access-Token': accessToken,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const error = await response.json()

    throw new Error(error?.message ?? 'Failed to create team')
  }

  revalidatePath('/dashboard', 'layout')

  const data =
    (await response.json()) as Database['public']['Tables']['teams']['Row']

  return data
})

// Upload team profile picture and update team record

export const uploadTeamProfilePictureAction = guard(
  async (formData: FormData) => {
    const teamId = formData.get('teamId') as string
    const image = formData.get('image') as File

    if (!teamId || !image) {
      throw InvalidParametersError('Team ID and image are required')
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(image.type)) {
      throw InvalidParametersError('File must be JPG, PNG, or SVG format')
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

    if (image.size > MAX_FILE_SIZE) {
      throw InvalidParametersError('File size must be less than 5MB')
    }

    const { user } = await checkAuthenticated()

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

    if (!isAuthorized) {
      throw UnauthorizedError('User is not authorized to update this team')
    }

    const extension = image.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}.${extension}`
    const filePath = `profile-pictures/teams/${teamId}/${fileName}`

    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      // Upload file to GCP Storage
      const publicUrl = await uploadFile(buffer, filePath, image.type)

      // Update team record with new profile picture URL
      const { data, error } = await supabaseAdmin
        .from('teams')
        .update({ profile_picture_url: publicUrl })
        .eq('id', teamId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Clean up old profile pictures asynchronously in the background
      // We don't await this promise, so it runs in the background
      ;(async () => {
        try {
          // Get the current file name from the path
          const currentFileName = fileName

          // List all files in the team's folder from GCP Storage
          const folderPath = `profile-pictures/teams/${teamId}`
          const [files] = await bucket.getFiles({
            prefix: folderPath,
          })

          // Delete all old profile pictures except the one we just uploaded
          for (const file of files) {
            const filePath = file.name
            // Skip the file we just uploaded
            if (filePath === `${folderPath}/${currentFileName}`) {
              continue
            }

            try {
              await bucket.file(filePath).delete()
            } catch (deleteError) {
              console.error(`Error deleting file ${filePath}:`, deleteError)
            }
          }

          // No need for Supabase storage cleanup anymore
        } catch (cleanupError) {
          console.error('Error during profile picture cleanup:', cleanupError)
        }
      })()

      revalidatePath(`/dashboard/[teamIdOrSlug]/general`, 'page')
    } catch (error) {
      console.error('Error uploading profile picture to GCP:', error)
      throw new Error('Failed to upload profile picture')
    }
  }
)
