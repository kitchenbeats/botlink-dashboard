export const WEBHOOK_EVENTS = [
  'create',
  'pause',
  'resume',
  'update',
  'kill',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  create: 'CREATE',
  pause: 'PAUSE',
  resume: 'RESUME',
  update: 'UPDATE',
  kill: 'KILL',
}

export const WEBHOOK_EXAMPLE_PAYLOAD = `{
  "timestamp": 1757839788,
  "sandboxID": "ef621980-59ad-4552-8cf7-c1b4984dcf13",
  "eventLabel": "create",
  // ... more fields, see docs
}`
