'use client'

import { Button } from '@/ui/primitives/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/primitives/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addTeamMemberAction } from '@/server/team/team-actions'
import { z } from 'zod'
import { Input } from '@/ui/primitives/input'
import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { useAction } from 'next-safe-action/hooks'

const addMemberSchema = z.object({
  email: z.string().email(),
})

type AddMemberForm = z.infer<typeof addMemberSchema>

interface AddMemberFormProps {
  className?: string
}

export default function AddMemberForm({ className }: AddMemberFormProps) {
  'use no memo'

  const selectedTeam = useSelectedTeam()
  const { toast } = useToast()

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: '',
    },
  })

  const { execute, isExecuting } = useAction(addTeamMemberAction, {
    onSuccess: () => {
      toast({
        description: 'The member has been added to the team.',
        variant: 'success',
      })
      form.reset()
    },
    onError: ({ error }) => {
      toast({
        description: error.serverError || 'An error occurred',
        variant: 'error',
      })
    },
  })

  function onSubmit(data: AddMemberForm) {
    if (!selectedTeam) {
      toast({
        description: 'No team selected',
        variant: 'error',
      })
      return
    }

    execute({
      teamId: selectedTeam.id,
      email: data.email,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('flex gap-2', className)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="relative flex-1">
              <FormLabel className="">E-mail</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="member@acme.com" {...field} />
                </FormControl>
                <Button
                  loading={isExecuting}
                  type="submit"
                  disabled={!form.formState.isValid}
                  variant="outline"
                >
                  Add Member
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
