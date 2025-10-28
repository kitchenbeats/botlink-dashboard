import 'server-cli-only'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { handleDefaultInfraError } from '@/lib/utils/action'
import { checkAuthenticated } from '@/lib/utils/server'
import { transformMetricsToClientMetrics } from '@/server/sandboxes/utils'
import { MetricsRequestSchema, MetricsResponse } from './types'

export async function POST(request: Request, props: { params: Promise<{ teamId: string }> }) {
  const params = await props.params;
  try {
    const { teamId } = await params

    const { success, data } = MetricsRequestSchema.safeParse(
      await request.json()
    )

    if (!success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { sandboxIds } = data

    // Use checkAuthenticated() which validates with getUser() and extracts access_token securely
    const { session } = await checkAuthenticated()

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

      l.error(
        {
          key: 'get_team_sandboxes_metrics',
          error: infraRes.error,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            path: '/sandboxes/metrics',
            status,
          },
        },
        `Failed to get team sandbox metrics: ${infraRes.error.message}`
      )

      return Response.json(
        { error: handleDefaultInfraError(status) },
        { status }
      )
    }

    const metrics = transformMetricsToClientMetrics(infraRes.data.sandboxes)

    return Response.json({ metrics } satisfies MetricsResponse)
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
