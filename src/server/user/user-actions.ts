'use server'

import { authActionClient } from '@/lib/clients/action'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { getUserAccessToken } from '@/lib/utils/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { returnValidationErrors } from 'next-safe-action'

const UpdateUserSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    name: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      return Boolean(data.email || data.password || data.name)
    },
    {
      message: 'At least one field must be provided (email, password, name)',
      path: [],
    }
  )

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

    if (!error) {
      return {
        user: updateData.user,
      }
    }

    switch (error.code) {
      case 'email_address_invalid':
        return returnValidationErrors(UpdateUserSchema, {
          email: {
            _errors: ['Invalid e-mail address'],
          },
        })
      case 'email_exists':
        return returnValidationErrors(UpdateUserSchema, {
          email: {
            _errors: ['E-mail already in use'],
          },
        })
      case 'same_password':
        return returnValidationErrors(UpdateUserSchema, {
          password: {
            _errors: ['New password cannot be the same as the old password'],
          },
        })
      case 'weak_password':
        return returnValidationErrors(UpdateUserSchema, {
          password: {
            _errors: ['Password is too weak'],
          },
        })
      default:
        throw new Error(error.message)
    }
  })

export const deleteAccountAction = authActionClient
  .metadata({ actionName: 'deleteAccount' })
  .action(async ({ ctx }) => {
    const { user } = ctx

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
      throw new Error(error.message)
    }
  })

export const getUserAccessTokenAction = authActionClient
  .metadata({ actionName: 'getUserAccessToken' })
  .action(async ({ ctx }) => {
    const { user } = ctx

    const accessToken = await getUserAccessToken(user.id)

    return {
      accessToken,
    }
  })
