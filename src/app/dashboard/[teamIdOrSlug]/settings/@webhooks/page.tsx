import WebhookControls from '@/features/dashboard/settings/webhooks/controls'
import WebhooksEmpty from '@/features/dashboard/settings/webhooks/empty'
import WebhookCard from '@/features/dashboard/settings/webhooks/webhook-card'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'
import { getWebhook } from '@/server/webhooks/get-webhook'
import Frame from '@/ui/frame'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/ui/primitives/card'

interface WebhooksPageClientProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
}

export default async function WebhooksPage({
  params,
}: WebhooksPageClientProps) {
  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  const webhookResult = await getWebhook({ teamId })

  return (
    <Frame
      classNames={{
        wrapper: 'w-full max-md:p-0',
        frame: 'max-md:border-none',
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <CardDescription className="max-w-[600px] text-fg">
              Webhooks allow your external service to be notified when sandbox
              lifecycle events happen. When the specified event happens, we'll
              send a POST request to the URL you provide.
            </CardDescription>

            <WebhookControls webhook={webhookResult?.data?.webhook} />
          </div>
        </CardHeader>

        <CardContent>
          {webhookResult?.data ? (
            <WebhookCard webhook={webhookResult.data.webhook} />
          ) : (
            <WebhooksEmpty
              error={
                webhookResult?.serverError &&
                'Failed to get webhook state. Try again or contact support.'
              }
            />
          )}
        </CardContent>
      </Card>
    </Frame>
  )
}
