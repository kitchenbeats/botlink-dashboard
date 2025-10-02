'use client'

import { useSelectedTeam } from '@/lib/hooks/use-teams'
import {
  defaultErrorToast,
  defaultSuccessToast,
  toast,
} from '@/lib/hooks/use-toast'
import { CreateWebhookSchema } from '@/server/webhooks/schema'
import {
  createWebhookAction,
  testWebhookAction,
} from '@/server/webhooks/webhooks-actions'
import { Button } from '@/ui/primitives/button'
import { Checkbox } from '@/ui/primitives/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/primitives/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/primitives/form'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EXAMPLE_PAYLOAD,
} from './constants'

interface AddWebhookDialogProps {
  children: React.ReactNode
}

export function AddWebhookDialog({ children: trigger }: AddWebhookDialogProps) {
  'use no memo'

  const selectedTeam = useSelectedTeam()
  const [open, setOpen] = useState(false)

  const {
    form,
    resetFormAndAction,
    handleSubmitWithAction,
    action: { isExecuting },
  } = useHookFormAction(createWebhookAction, zodResolver(CreateWebhookSchema), {
    formProps: {
      defaultValues: {
        teamId: selectedTeam?.id,
        url: '',
        events: [],
      },
    },
    actionProps: {
      onSuccess: () => {
        toast(defaultSuccessToast('Webhook created successfully'))
        handleDialogChange(false)
      },
      onError: ({ error }) => {
        toast(
          defaultErrorToast(error.serverError || 'Failed to create webhook')
        )
      },
    },
  })

  const { execute: testWebhook, isPending: isTesting } = useAction(
    testWebhookAction,
    {
      onSuccess: () => {
        toast(defaultSuccessToast('Test webhook sent'))
      },
      onError: ({ error }) => {
        toast(defaultErrorToast(error.serverError || 'Failed to send test'))
      },
    }
  )

  const handleDialogChange = (value: boolean) => {
    setOpen(value)

    if (value) return

    resetFormAndAction()
  }

  const selectedEvents = form.watch('events') || []
  const allEventsSelected =
    selectedEvents.length === WEBHOOK_EVENTS.length &&
    WEBHOOK_EVENTS.every((event) => selectedEvents.includes(event))

  const handleAllToggle = () => {
    if (allEventsSelected) {
      form.setValue('events', [])
    } else {
      form.setValue('events', [...WEBHOOK_EVENTS])
    }
  }

  const handleEventToggle = (event: string) => {
    const currentEvents = form.getValues('events') || []
    if (currentEvents.includes(event)) {
      form.setValue(
        'events',
        currentEvents.filter((e) => e !== event)
      )
    } else {
      form.setValue('events', [...currentEvents, event])
    }
  }

  const handleTest = () => {
    if (!selectedTeam) return

    testWebhook({ teamId: selectedTeam.id })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmitWithAction}>
            <div className="flex flex-col gap-6 pb-6">
              {/* URL Input */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/postreceive"
                        disabled={isExecuting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Events Selection */}
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <FormLabel>Received Lifecycle Events</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-3">
                        {/* ALL checkbox */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="event-all"
                            checked={allEventsSelected}
                            onCheckedChange={handleAllToggle}
                            disabled={isExecuting}
                          />
                          <Label
                            htmlFor="event-all"
                            className="cursor-pointer select-none"
                          >
                            ALL
                          </Label>
                        </div>

                        {/* Individual event checkboxes */}
                        {WEBHOOK_EVENTS.map((event) => (
                          <div key={event} className="flex items-center gap-2">
                            <Checkbox
                              id={`event-${event}`}
                              checked={selectedEvents.includes(event)}
                              onCheckedChange={() => handleEventToggle(event)}
                              disabled={isExecuting}
                            />
                            <Label
                              htmlFor={`event-${event}`}
                              className="cursor-pointer select-none"
                            >
                              {WEBHOOK_EVENT_LABELS[event]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <div className="flex flex-col gap-2">
                <p className="text-fg-tertiary prose-body">
                  We'll send a POST request with a JSON payload to{' '}
                  {form.watch('url') || 'https://example.com/postreceive'} for
                  each event. Example:
                </p>
                <pre className="bg-bg-1 border border-stroke p-3 text-xs font-mono overflow-x-auto">
                  {WEBHOOK_EXAMPLE_PAYLOAD}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isExecuting || isTesting || !form.watch('url')}
                loading={isTesting}
              >
                Test
              </Button>
              <Button
                type="submit"
                disabled={isExecuting || selectedEvents.length === 0}
                loading={isExecuting}
              >
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
