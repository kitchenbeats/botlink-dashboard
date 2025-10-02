import { z } from 'zod'
import { zfd } from 'zod-form-data'

const WebhookUrlSchema = z
  .string({ required_error: 'URL is required' })
  .url('Must be a valid URL')
  .trim()

export const CreateWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
  url: zfd.text(WebhookUrlSchema),
  events: zfd.repeatable(z.array(zfd.text())),
})

export const UpdateWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
  url: zfd.text(WebhookUrlSchema).optional(),
  events: zfd.repeatable(z.array(zfd.text()).min(1)).optional(),
})

export const DeleteWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
})

export const TestWebhookSchema = zfd.formData({
  teamId: zfd.text(z.string().uuid()),
})

export type CreateWebhookSchemaType = z.infer<typeof CreateWebhookSchema>
export type UpdateWebhookSchemaType = z.infer<typeof UpdateWebhookSchema>
export type DeleteWebhookSchemaType = z.infer<typeof DeleteWebhookSchema>
export type TestWebhookSchemaType = z.infer<typeof TestWebhookSchema>
