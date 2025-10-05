import { SandboxWebhooksPayloadGet } from '@/types/argus.types'

interface WebhookCardProps {
  webhook: SandboxWebhooksPayloadGet
}

export default function WebhookCard({ webhook }: WebhookCardProps) {
  return <div>WebhookCard</div>
}
