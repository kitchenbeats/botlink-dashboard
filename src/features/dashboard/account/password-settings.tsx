'use client'

import { updateUserAction } from '@/server/user/user-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import { Button } from '@/ui/primitives/button'
import { Input } from '@/ui/primitives/input'
import { useUser } from '@/lib/hooks/use-user'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/primitives/form'
import { defaultSuccessToast, defaultErrorToast } from '@/lib/hooks/use-toast'
import { useMemo, useState, useEffect } from 'react'
import { ReauthDialog } from './reauth-dialog'
import { getUserProviders } from '@/lib/utils/auth'

const formSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    nonce: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

interface PasswordSettingsProps {
  className?: string
  showPasswordChangeForm: boolean
}

export function PasswordSettings({
  className,
  showPasswordChangeForm,
}: PasswordSettingsProps) {
  'use no memo'

  const { user } = useUser()
  const { toast } = useToast()
  const [reauthDialogOpen, setReauthDialogOpen] = useState(false)
  const [clientShowPasswordForm, setClientShowPasswordForm] = useState(
    showPasswordChangeForm
  )

  useEffect(() => {
    setClientShowPasswordForm(showPasswordChangeForm)
  }, [showPasswordChangeForm])

  const hasEmailProvider = useMemo(
    () => getUserProviders(user)?.includes('email'),
    [user]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const { execute: updatePassword, isPending } = useAction(updateUserAction, {
    onSuccess: ({ data }) => {
      if (data?.requiresReauth) {
        setReauthDialogOpen(true)
        return
      }

      toast(defaultSuccessToast('Password updated.'))

      form.reset()
      setClientShowPasswordForm(false)
      window.history.replaceState({}, '', window.location.pathname)
    },
    onError: ({ error }) => {
      if (error.validationErrors?.fieldErrors?.password) {
        form.setError('confirmPassword', {
          message: error.validationErrors.fieldErrors.password?.[0],
        })
      } else {
        toast(
          defaultErrorToast(error.serverError || 'Failed to update password.')
        )
      }
    },
  })

  function onSubmit(values: FormValues) {
    updatePassword({ password: values.password })
  }

  function handleChangePassword() {
    setReauthDialogOpen(true)
  }

  if (!user || !hasEmailProvider) return null

  return (
    <>
      <Card className={cn('overflow-hidden rounded-xs border', className)}>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>

        <CardContent className="relative flex w-full max-w-90 flex-col gap-2">
          {clientShowPasswordForm ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="New password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm password"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                form.handleSubmit(onSubmit)()
                              }
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          ) : (
            <>
              <p className="text-fg-300 text-md">
                To change your password, you'll need to re-authenticate for
                security.
              </p>
              <Button
                type="button"
                onClick={handleChangePassword}
                className="mt-2 w-fit"
              >
                Change Password
              </Button>
            </>
          )}
        </CardContent>

        {clientShowPasswordForm && (
          <CardFooter className="bg-bg-100 justify-between gap-6">
            <p className="text-fg-500 text-sm">
              Your password must be at least 8 characters long.
            </p>
            <Button
              type="submit"
              loading={isPending}
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending || !form.formState.isValid}
            >
              Update password
            </Button>
          </CardFooter>
        )}
      </Card>

      <ReauthDialog
        open={reauthDialogOpen}
        onOpenChange={setReauthDialogOpen}
      />
    </>
  )
}
