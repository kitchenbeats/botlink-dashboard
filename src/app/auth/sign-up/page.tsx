'use client'

import { signUpAction } from '@/server/auth/auth-actions'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'
import Link from 'next/link'
import { Button } from '@/ui/primitives/button'
import { OAuthProviders } from '@/features/auth/oauth-provider-buttons'
import { AuthFormMessage, AuthMessage } from '@/features/auth/form-message'
import TextSeparator from '@/ui/text-separator'
import { useSearchParams } from 'next/navigation'
import { useRef, useEffect, Suspense } from 'react'
import { AUTH_URLS } from '@/configs/urls'

export default function Signup() {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  // Focus management
  useEffect(() => {
    const email = searchParams.get('email')
    if (email && emailRef.current) {
      emailRef.current.value = email
      passwordRef.current?.focus()
    } else {
      emailRef.current?.focus()
    }
  }, [searchParams])

  // Get returnTo URL from search params
  const returnTo = searchParams.get('returnTo')

  // Parse search params into AuthMessage
  const message: AuthMessage | undefined = (() => {
    const error = searchParams.get('error')
    const success = searchParams.get('success')
    if (error) return { error: decodeURIComponent(error) }
    if (success) return { success: decodeURIComponent(success) }
    return undefined
  })()

  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-medium">Sign up</h1>

      <Suspense>
        <OAuthProviders />
      </Suspense>

      <TextSeparator text="or" />

      <form className="flex flex-col gap-2">
        <input type="hidden" name="returnTo" value={returnTo || ''} />
        <Label htmlFor="email">E-Mail</Label>
        <Input
          name="email"
          placeholder="you@example.com"
          required
          className="mb-3"
          autoComplete="off"
        />
        <Label htmlFor="password">Password</Label>
        <div className="mb-3 space-y-3">
          <Input
            ref={passwordRef}
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            minLength={6}
            required
            autoComplete="new-password"
          />
          <Input
            ref={confirmPasswordRef}
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>
        <Button formAction={signUpAction}>Sign up</Button>
      </form>

      <p className="mt-3 text-sm leading-6 text-fg-300">
        Already have an account?{' '}
        <Link
          className="font-medium text-fg underline"
          href={AUTH_URLS.SIGN_IN}
        >
          Sign in
        </Link>
      </p>

      {message && <AuthFormMessage className="mt-4" message={message} />}
    </div>
  )
}
