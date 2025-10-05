'use client'

import { SandboxWebhooksPayloadGet } from '@/types/argus.types'
import { Button } from '@/ui/primitives/button'
import { EditIcon, TrashIcon } from '@/ui/primitives/icons'
import { Plus } from 'lucide-react'
import WebhookAddEditDialog from './add-edit-dialog'
import WebhookDeleteDialog from './delete-dialog'

interface WebhookControlsProps {
  webhook?: SandboxWebhooksPayloadGet
}

export default function WebhookControls({ webhook }: WebhookControlsProps) {
  if (webhook) {
    return (
      <div className="flex gap-1 justify-center max-md:w-full max-md:flex-row-reverse">
        <WebhookAddEditDialog mode="edit" webhook={webhook}>
          <Button variant="outline" className="max-md:w-full">
            <EditIcon className="size-4 text-fg-tertiary" /> Edit
          </Button>
        </WebhookAddEditDialog>
        <WebhookDeleteDialog webhook={webhook}>
          <Button variant="outline" className="max-md:w-full">
            <TrashIcon className="size-4 text-fg-tertiary" /> Delete
          </Button>
        </WebhookDeleteDialog>
      </div>
    )
  }

  return (
    <WebhookAddEditDialog mode="add">
      <Button className="w-full sm:w-auto sm:self-start" disabled={!webhook}>
        <Plus className="size-4" /> Add Webhook
      </Button>
    </WebhookAddEditDialog>
  )
}
