'use server'

import { authActionClient } from '@/lib/clients/action'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { getUserAccessToken } from '@/lib/utils/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
})

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>

export const updateUserAction = authActionClient
  .schema(UpdateUserSchema)
  .metadata({ actionName: 'updateUser' })
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx
    const origin = (await headers()).get('origin')

    const { data: updateData, error } = await supabase.auth.updateUser(
      {
        email: parsedInput.email,
        password: parsedInput.password,
        data: {
          name: parsedInput.name,
        },
      },
      {
        emailRedirectTo: `${origin}/api/auth/email-callback?new_email=${parsedInput.email}`,
      }
    )

    if (error) {
      switch (error.code) {
        case 'email_address_invalid':
          return {
            success: false,
            validationErrors: {
              fieldErrors: {
                email: ['Invalid e-mail address'],
              },
            },
          }
        case 'email_exists':
          return {
            success: false,
            validationErrors: {
              fieldErrors: { email: ['E-mail already in use'] },
            },
          }
        case 'same_password':
          return {
            success: false,
            validationErrors: {
              fieldErrors: {
                password: [
                  'New password cannot be the same as the old password',
                ],
              },
            },
          }
        case 'weak_password':
          return {
            success: false,
            validationErrors: {
              fieldErrors: {
                password: ['Password is too weak'],
              },
            },
          }
        default:
          throw new Error(error.message)
      }
    }

    return {
      success: true,
      newUser: updateData.user,
    }
  })

export const deleteAccountAction = authActionClient.action(async ({ ctx }) => {
  const { user } = ctx

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
})

export const getUserAccessTokenAction = authActionClient.action(
  async ({ ctx }) => {
    const { user } = ctx

    const accessToken = await getUserAccessToken(user.id)

    return {
      success: true,
      accessToken,
    }
  }
)
