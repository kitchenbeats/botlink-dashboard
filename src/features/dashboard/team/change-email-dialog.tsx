'use client'

import * as React from 'react'
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog'
import { Button } from '@/ui/primitives/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/primitives/form'
import { Input } from '@/ui/primitives/input'
import { updateTeamEmailAction } from '@/server/team/team-actions'
import {
  toast,
  defaultSuccessToast,
  defaultErrorToast,
} from '@/lib/hooks/use-toast'
import { UpdateTeamEmailSchema } from '@/server/team/types'

interface ChangeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  currentEmail: string
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  teamId,
  currentEmail,
}: ChangeEmailDialogProps) {
  'use no memo'

  const {
    form,
    resetFormAndAction,
    handleSubmitWithAction,
    action: { isExecuting },
  } = useHookFormAction(
    updateTeamEmailAction,
    zodResolver(UpdateTeamEmailSchema),
    {
      formProps: {
        defaultValues: {
          teamId,
          email: currentEmail,
        },
      },
      actionProps: {
        onSuccess: () => {
          toast(defaultSuccessToast('Team email was updated.'))
          handleDialogChange(false)
        },
        onError: () => {
          toast(defaultErrorToast('Failed to update team email.'))
        },
      },
    }
  )

  const handleDialogChange = (value: boolean) => {
    onOpenChange(value)

    if (value) return

    resetFormAndAction()
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Team E-Mail</DialogTitle>
          <DialogDescription>
            Update the e-mail address associated with this team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmitWithAction}>
            <div className="flex flex-col gap-3 px-2 py-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter team email"
                        disabled={isExecuting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isExecuting}
                loading={isExecuting}
              >
                Update E-Mail
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
