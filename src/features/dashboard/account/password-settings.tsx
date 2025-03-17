'use client'

import { forgotPasswordAction } from '@/server/auth/auth-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import { Button } from '@/ui/primitives/button'
import { useUser } from '@/lib/hooks/use-user'
import { cn } from '@/lib/utils'
import { useAction } from 'next-safe-action/hooks'
import {
  defaultSuccessToast,
  defaultErrorToast,
  useToast,
} from '@/lib/hooks/use-toast'

interface PasswordSettingsProps {
  className?: string
}

export function PasswordSettings({ className }: PasswordSettingsProps) {
  const { user } = useUser()
  const { toast } = useToast()

  const { execute: forgotPassword, isExecuting: isForgotPasswordPending } =
    useAction(forgotPasswordAction, {
      onSuccess: () => {
        toast(defaultSuccessToast('Password reset e-mail sent.'))
      },
      onError: ({ error }) => {
        toast(
          defaultErrorToast(error.serverError || 'Failed to reset password.')
        )
      },
    })

  if (!user) return null

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Change your account password used to sign in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          variant="outline"
          onClick={() => {
            if (!user?.email) return

            const formData = new FormData()
            formData.set('email', user.email)
            formData.set('callbackUrl', '/dashboard/account')

            forgotPassword(formData)
          }}
          loading={isForgotPasswordPending}
        >
          Change Password
        </Button>
      </CardContent>
    </Card>
  )
}
