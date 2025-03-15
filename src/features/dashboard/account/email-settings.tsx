'use client'

import { updateUserAction } from '@/server/user/user-actions'
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
import { useUser } from '@/lib/hooks/use-user'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/hooks/use-toast'

const formSchema = z.object({
  email: z.string().email('Invalid e-mail address'),
})

type FormValues = z.infer<typeof formSchema>

interface EmailSettingsProps {
  className?: string
}

export function EmailSettings({ className }: EmailSettingsProps) {
  'use no memo'

  const { user, setUser, refetch: refetchUser } = useUser()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get('new_email') || user?.email || '',
    },
    values: {
      email: searchParams.get('new_email') || user?.email || '',
    },
  })

  const { execute: updateEmail, isPending } = useAction(updateUserAction, {
    onSuccess: () => {
      toast({
        title: 'Check your email for a verification link',
        variant: 'success',
      })
    },
    onError: ({ error }) => {
      if (error.validationErrors?.fieldErrors?.email?.[0]) {
        toast({
          title: 'Validation Error',
          description: error.validationErrors?.fieldErrors?.email?.[0],
          variant: 'error',
        })
        return
      }

      toast({
        title: 'Error Updating E-Mail',
        description: error.serverError || 'Failed to update e-mail',
        variant: 'error',
      })
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

        toast({
          title: decodeURIComponent(searchParams.get('success')!),
          variant: 'success',
        })

        refetchUser()
      } else {
        toast({
          title: 'Error',
          description: decodeURIComponent(searchParams.get('error')!),
          variant: 'error',
        })
      }
    }
  }, [searchParams])

  if (!user) return null

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>E-Mail</CardTitle>
        <CardDescription>Update your email address.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              updateEmail({ email: values.email })
            )}
            className="flex gap-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="max-w-[17rem] flex-1">
                  <FormControl>
                    <Input
                      placeholder="E-Mail"
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
      </CardContent>
    </Card>
  )
}
