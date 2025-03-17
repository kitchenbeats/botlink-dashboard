'use client'

import { Input } from '@/ui/primitives/input'
import { Skeleton } from '@/ui/primitives/skeleton'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/ui/primitives/form'

interface EmailCardProps {
  className?: string
}

type FormData = {
  email: string
}

const formSchema = z.object({
  email: z.string().email('Invalid e-mail address'),
})

export function EmailCard({ className }: EmailCardProps) {
  const team = useSelectedTeam()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: team?.email ?? '',
    },
  })

  const { control } = form

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>E-Mail</CardTitle>
        <CardDescription>
          The primary team email to receive notifications on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {team ? (
          <Form {...form}>
            <form className="flex max-w-xs items-center gap-2">
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="info@acme.com"
                        disabled
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <Skeleton className="h-10 w-[17rem]" />
        )}
      </CardContent>
    </Card>
  )
}
