'use server'

import { encodedRedirect } from '@/lib/utils/auth'
import { createClient } from '@/lib/clients/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Provider } from '@supabase/supabase-js'
import { AUTH_URLS, PROTECTED_URLS } from '@/configs/urls'
import { logger } from '@/lib/clients/logger'
import { actionClient } from '@/lib/clients/action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

export const signInWithOAuthAction = actionClient
  .schema(
    z.object({
      provider: z.string() as unknown as z.ZodType<Provider>,
      returnTo: z.string().optional(),
    })
  )
  .metadata({ actionName: 'signInWithOAuth' })
  .action(async ({ parsedInput, ctx }) => {
    const { provider, returnTo } = parsedInput

    const supabase = await createClient()

    const origin = (await headers()).get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${origin}${AUTH_URLS.CALLBACK}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
        scopes: 'email',
      },
    })

    if (error) {
      const queryParams = returnTo ? { returnTo } : undefined
      throw encodedRedirect(
        'error',
        AUTH_URLS.SIGN_IN,
        error.message,
        queryParams
      )
    }

    if (data.url) {
      redirect(data.url)
    }

    throw encodedRedirect(
      'error',
      AUTH_URLS.SIGN_IN,
      'Something went wrong',
      returnTo ? { returnTo } : undefined
    )
  })

// Sign up action with zod-form-data
const signUpSchema = zfd.formData({
  email: zfd.text(z.string().email('Valid email is required')),
  password: zfd.text(
    z.string().min(8, 'Password must be at least 8 characters')
  ),
  confirmPassword: zfd.text(),
  returnTo: zfd.text(z.string().optional()),
})

export const signUpAction = actionClient
  .schema(signUpSchema)
  .metadata({ actionName: 'signUp' })
  .action(async ({ parsedInput }) => {
    const { email, password, confirmPassword, returnTo = '' } = parsedInput
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || ''

    if (password !== confirmPassword) {
      throw encodedRedirect(
        'error',
        AUTH_URLS.SIGN_UP,
        'Passwords do not match',
        { returnTo }
      )
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${AUTH_URLS.CALLBACK}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
      },
    })

    if (error) {
      console.error(error.code + ' ' + error.message)
      throw encodedRedirect('error', AUTH_URLS.SIGN_UP, error.message, {
        returnTo,
      })
    } else {
      throw encodedRedirect(
        'success',
        AUTH_URLS.SIGN_UP,
        'Thanks for signing up! Please check your email for a verification link.',
        { returnTo }
      )
    }
  })

const signInSchema = zfd.formData({
  email: zfd.text(z.string().email('Valid email is required')),
  password: zfd.text(z.string().min(1, 'Password is required')),
  returnTo: zfd.text(z.string().optional()),
})

export const signInAction = actionClient
  .schema(signInSchema)
  .metadata({ actionName: 'signInWithEmailAndPassword' })
  .action(async ({ parsedInput }) => {
    const { email, password, returnTo = '' } = parsedInput
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw encodedRedirect('error', AUTH_URLS.SIGN_IN, error.message, {
        returnTo,
      })
    }

    redirect(returnTo || PROTECTED_URLS.DASHBOARD)
  })

const forgotPasswordSchema = zfd.formData({
  email: zfd.text(z.string().email('Valid email is required')),
  callbackUrl: zfd.text(z.string().optional()),
})

export const forgotPasswordAction = actionClient
  .schema(forgotPasswordSchema)
  .metadata({ actionName: 'forgotPassword' })
  .action(async ({ parsedInput }) => {
    const { email, callbackUrl } = parsedInput
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}${AUTH_URLS.CALLBACK}?redirect_to=${AUTH_URLS.RESET_PASSWORD}`,
    })

    if (error) {
      logger.error(error.message)
      throw encodedRedirect(
        'error',
        AUTH_URLS.FORGOT_PASSWORD,
        'Could not reset password'
      )
    }

    throw encodedRedirect(
      'success',
      callbackUrl || AUTH_URLS.FORGOT_PASSWORD,
      'Check your email for a link to reset your password.',
      // we add a type for the case that this is called from the account page
      // -> account page needs to know what message type to display
      {
        type: 'reset_password',
      }
    )
  })

/* Commented out as in original code
export const resetPasswordAction = actionClient
  .schema(zfd.formData({
    password: zfd.text(z.string().min(8, 'Password must be at least 8 characters')),
    confirmPassword: zfd.text(),
  }))
  .metadata({ actionName: 'resetPassword' })
  .action(async ({ parsedInput }) => {
    const { password, confirmPassword } = parsedInput
    const supabase = await createClient()

    if (password !== confirmPassword) {
      throw encodedRedirect(
        'error',
        AUTH_URLS.RESET_PASSWORD,
        'Passwords do not match'
      )
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      logger.error(error.message)
      throw encodedRedirect(
        'error',
        AUTH_URLS.RESET_PASSWORD,
        'Password update failed'
      )
    }

    throw encodedRedirect(
      'success',
      AUTH_URLS.RESET_PASSWORD,
      'Password updated'
    )
  })
*/

export const signOutAction = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect(AUTH_URLS.SIGN_IN)
}
