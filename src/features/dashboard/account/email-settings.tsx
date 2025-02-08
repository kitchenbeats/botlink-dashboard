'use client'

import { updateUserAction } from '@/server/user/user-actions'
import { AuthFormMessage } from '@/features/auth/form-message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import { Button } from '@/ui/primitives/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/primitives/form'
import { Input } from '@/ui/primitives/input'
import { useTimeoutMessage } from '@/lib/hooks/use-timeout-message'
import { useUser } from '@/lib/hooks/use-user'
import { AnimatePresence } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormValues = z.infer<typeof formSchema>

interface EmailSettingsProps {
  className?: string
}

export function EmailSettings({ className }: EmailSettingsProps) {
  const { user, setUser, refetch: refetchUser } = useUser()
  const searchParams = useSearchParams()
  const [message, setMessage] = useTimeoutMessage()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get('new_email') || user?.email || '',
    },
  })

  const { mutate: updateEmail, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await updateUserAction({ email: values.email })

      if (response.type === 'error') {
        throw new Error(response.message)
      }

      return response
    },
    onSuccess: () => {
      setMessage({ success: 'Check your email for a verification link' })
    },
    onError: (error: Error) => {
      setMessage({ error: error.message })
    },
  })

  useEffect(() => {
    if (
      !searchParams.has('success') &&
      !searchParams.has('error') &&
      !searchParams.has('type')
    )
      return

    if (searchParams.get('type') === 'update_email') {
      if (searchParams.has('success')) {
        if (searchParams.has('new_email')) {
          setUser((state) => ({
            ...state!,
            email: searchParams.get('new_email')!,
          }))
        }

        setMessage({
          success: decodeURIComponent(searchParams.get('success')!),
        })

        refetchUser()
      } else {
        setMessage({
          error: decodeURIComponent(searchParams.get('error')!),
        })
      }
    }
  }, [searchParams])

  if (!user) return null

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>Update your email address.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => updateEmail(values))}
            className="flex items-center gap-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="max-w-[17rem] flex-1">
                  <FormControl>
                    <Input
                      placeholder="Email"
                      className="md:max-w-[17rem]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              loading={isPending}
              disabled={form.watch('email') === user?.email}
              type="submit"
              variant="outline"
            >
              Save
            </Button>
          </form>
        </Form>

        <AnimatePresence initial={false} mode="wait">
          {message && <AuthFormMessage message={message} className="mt-4" />}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
