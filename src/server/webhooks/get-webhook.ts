import 'server-only'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient } from '@/lib/clients/action'
import { l } from '@/lib/clients/logger/logger'
import { handleDefaultInfraError } from '@/lib/utils/action'
import { SandboxWebhooksPayloadGet } from '@/types/argus.types'
import { z } from 'zod'

const GetWebhookSchema = z.object({
  teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
})

export const getWebhook = authActionClient
  .schema(GetWebhookSchema)
  .metadata({ serverFunctionName: 'getWebhook' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const response = await fetch(
      `${process.env.INFRA_API_URL}/events/webhooks/sandboxes`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
        },
      }
    )

    if (!response.ok) {
      const status = response.status

      const text = await response.text()

      l.error(
        {
          key: 'get_webhook:infra_error',
          error: `${status}: ${text}`,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
            teamId,
          },
        },
        `Failed to get webhook: ${text}`
      )

      return handleDefaultInfraError(status)
    }

    const data = (await response.json()) as SandboxWebhooksPayloadGet

    return { webhook: data }
  })
