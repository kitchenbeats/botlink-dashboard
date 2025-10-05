'use client'

import { useShikiTheme } from '@/configs/shiki'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import {
  defaultErrorToast,
  defaultSuccessToast,
  toast,
} from '@/lib/hooks/use-toast'
import { UpsertWebhookSchema } from '@/server/webhooks/schema'
import {
  testWebhookAction,
  upsertWebhookAction,
} from '@/server/webhooks/webhooks-actions'
import { SandboxWebhooksPayloadGet } from '@/types/argus.types'
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
import { CheckIcon } from '@/ui/primitives/icons'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'
import { ScrollArea, ScrollBar } from '@/ui/primitives/scroll-area'
import { Separator } from '@/ui/primitives/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import ShikiHighlighter from 'react-shiki'
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EXAMPLE_PAYLOAD,
} from './constants'

type WebhookAddEditDialogProps =
  | {
      children: React.ReactNode
      mode: 'add'
      webhook?: undefined
    }
  | {
      children: React.ReactNode
      mode: 'edit'
      webhook: SandboxWebhooksPayloadGet
    }

export default function WebhookAddEditDialog({
  children: trigger,
  mode,
  webhook,
}: WebhookAddEditDialogProps) {
  'use no memo'

  const selectedTeam = useSelectedTeam()
  const [open, setOpen] = useState(false)
  const shikiTheme = useShikiTheme()

  const isEditMode = mode === 'edit'

  const {
    form,
    resetFormAndAction,
    handleSubmitWithAction,
    action: { isExecuting },
  } = useHookFormAction(upsertWebhookAction, zodResolver(UpsertWebhookSchema), {
    formProps: {
      defaultValues: {
        teamId: selectedTeam?.id,
        mode,
        url: webhook?.url || '',
        events: webhook?.events || [],
      },
    },
    actionProps: {
      onSuccess: () => {
        toast(
          defaultSuccessToast(
            isEditMode
              ? 'Webhook updated successfully'
              : 'Webhook created successfully'
          )
        )
        handleDialogChange(false)
      },
      onError: ({ error }) => {
        toast(
          defaultErrorToast(
            error.serverError ||
              (isEditMode
                ? 'Failed to update webhook'
                : 'Failed to create webhook')
          )
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Webhook' : 'Add Webhook'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmitWithAction} className="min-w-0">
            {/* Hidden fields */}
            <input type="hidden" {...form.register('mode')} />
            <input type="hidden" {...form.register('teamId')} />

            <div className="flex flex-col gap-4 pb-6 min-w-0">
              {/* URL Input */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel className="text-fg-tertiary">URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/postreceive"
                        disabled={isExecuting}
                        className="min-w-0"
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
                    <FormLabel className="text-fg-tertiary">
                      Received Lifecycle Events
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
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

                        <Separator className="w-4" />

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
              <div className="flex flex-col gap-2 min-w-0">
                <p className="text-fg-tertiary prose-body break-words">
                  We'll send a POST request with a JSON payload to{' '}
                  <span className="break-all">
                    {form.watch('url') || 'https://example.com/postreceive'}
                  </span>{' '}
                  for each event. Example:
                </p>
                <div className="border overflow-hidden w-full">
                  <ScrollArea>
                    <ShikiHighlighter
                      language="json"
                      theme={shikiTheme}
                      className="px-3 py-2 text-xs"
                      addDefaultStyles={false}
                      showLanguage={false}
                    >
                      {WEBHOOK_EXAMPLE_PAYLOAD}
                    </ShikiHighlighter>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isExecuting || isTesting || !form.watch('url')}
                loading={isTesting}
                className="w-full"
              >
                Test
              </Button>
              <Button
                type="submit"
                disabled={isExecuting || selectedEvents.length === 0}
                loading={isExecuting}
                className="w-full"
              >
                {isEditMode ? (
                  <>
                    <CheckIcon className="size-4" />
                    Confirm
                  </>
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
