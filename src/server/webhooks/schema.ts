import { z } from 'zod'
import { zfd } from 'zod-form-data'

const WebhookUrlSchema = z
  .string({ required_error: 'URL is required' })
  .url('Must be a valid URL')
  .trim()

export const UpsertWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
  mode: zfd.text(z.enum(['add', 'edit'])),
  url: zfd.text(WebhookUrlSchema),
  events: zfd.repeatable(z.array(zfd.text()).min(1)),
})

export const DeleteWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
})

export const TestWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
})

export type UpsertWebhookSchemaType = z.infer<typeof UpsertWebhookSchema>
export type DeleteWebhookSchemaType = z.infer<typeof DeleteWebhookSchema>
export type TestWebhookSchemaType = z.infer<typeof TestWebhookSchema>
