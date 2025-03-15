'use server'

import { encodedRedirect } from '@/lib/utils/auth'
import { createClient } from '@/lib/clients/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Provider } from '@supabase/supabase-js'
import { AUTH_URLS, PROTECTED_URLS } from '@/configs/urls'
import { actionClient, returnServerError } from '@/lib/clients/action'
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

const signUpSchema = zfd
  .formData({
    email: zfd.text(z.string().email('Valid email is required')),
    password: zfd.text(
      z.string().min(8, 'Password must be at least 8 characters')
    ),
    confirmPassword: zfd.text(),
    returnTo: zfd.text(z.string().optional()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const signUpAction = actionClient
  .schema(signUpSchema)
  .metadata({ actionName: 'signUp' })
  .action(async ({ parsedInput }) => {
    const { email, password, confirmPassword, returnTo = '' } = parsedInput
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || ''

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${AUTH_URLS.CALLBACK}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
      },
    })

    if (error) {
      switch (error.code) {
        case 'email_exists':
          return returnServerError('Email already in use')
        case 'weak_password':
          return returnServerError('Password is too weak')
        default:
          throw error
      }
    }
  })

const signInSchema = zfd.formData({
  email: zfd.text(z.string().email('Valid email is required')),
  password: zfd.text(
    z.string().min(8, 'Password must be at least 8 characters')
  ),
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
      if (error.code === 'invalid_credentials') {
        return returnServerError('Invalid credentials')
      }
      throw error
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
    const { email } = parsedInput
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}${AUTH_URLS.CALLBACK}?redirect_to=${AUTH_URLS.RESET_PASSWORD}`,
    })

    if (error) {
      throw error
    }
  })

export const signOutAction = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect(AUTH_URLS.SIGN_IN)
}
