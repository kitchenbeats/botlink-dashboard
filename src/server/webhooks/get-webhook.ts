import 'server-only'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient } from '@/lib/clients/action'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { handleDefaultInfraError } from '@/lib/utils/action'
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

    const response = await infra.GET('/events/webhooks/sandboxes', {
      headers: {
        ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
      },
    })

    if (response.error) {
      const status = response.response.status

      l.error(
        {
          key: 'get_webhook:infra_error',
          status,
          error: response.error,
          team_id: teamId,
          user_id: session.user.id,
        },
        `Failed to get webhook: ${status}: ${response.error.message}`
      )

      return handleDefaultInfraError(status)
    }

    const data = response.data

    return { webhook: data }
  })
