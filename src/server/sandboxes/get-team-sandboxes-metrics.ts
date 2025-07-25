import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient } from '@/lib/clients/action'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger'
import { handleDefaultInfraError } from '@/lib/utils/action'
import { transformMetricsToClientMetrics } from '@/lib/utils/sandboxes'
import { ClientSandboxesMetrics } from '@/types/sandboxes.types'
import { z } from 'zod'

const GetTeamSandboxesMetricsSchema = z.object({
  teamId: z.string(),
  sandboxIds: z.array(z.string()),
})

export const getTeamSandboxesMetrics = authActionClient
  .metadata({
    serverFunctionName: 'getTeamSandboxesMetrics',
  })
  .schema(GetTeamSandboxesMetricsSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<{
      metrics: ClientSandboxesMetrics
    }> => {
      const { teamId, sandboxIds } = parsedInput
      const { session } = ctx

      if (
        sandboxIds.length === 0 ||
        process.env.NEXT_PUBLIC_MOCK_DATA === '1'
      ) {
        return {
          metrics: {},
        }
      }

      const infraRes = await infra.GET('/sandboxes/metrics', {
        params: {
          query: {
            sandbox_ids: sandboxIds,
          },
        },
        headers: {
          ...SUPABASE_AUTH_HEADERS(session.access_token, teamId),
        },
        cache: 'no-store',
      })

      if (infraRes.error) {
        const status = infraRes.response.status

        l.error('GET_TEAM_SANDBOXES_METRICS:INFRA_ERROR', infraRes.error, {
          path: '/sandboxes/metrics',
          teamId,
          userId: session.user.id,
          status,
          sandboxIds,
        })

        return handleDefaultInfraError(status)
      }

      const metrics = transformMetricsToClientMetrics(infraRes.data.sandboxes)

      return {
        metrics,
      }
    }
  )
