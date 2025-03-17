'use client'

import { updateUserAction } from '@/server/user/user-actions'
import { Button } from '@/ui/primitives/button'
import { Input } from '@/ui/primitives/input'
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

const formSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export default function ResetPasswordForm() {
  'use no memo'

  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const { execute: updatePassword, isPending } = useAction(updateUserAction, {
    onSuccess: () => {
      toast(defaultSuccessToast('Password updated.'))
      form.reset()
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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-medium">Reset password</h1>
        <p className="text-foreground/60 mb-4 text-sm">
          Please enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex w-full flex-col gap-2"
        >
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" loading={isPending} className="mt-4">
            Reset password
          </Button>
        </form>
      </Form>
    </div>
  )
}
