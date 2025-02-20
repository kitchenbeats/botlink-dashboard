import 'server-only'

import {
  checkAuthenticated,
  getApiUrl,
  getTeamApiKey,
  guard,
} from '@/lib/utils/server'
import { z } from 'zod'
import { MOCK_METRICS_DATA, MOCK_SANDBOXES_DATA } from '@/configs/mock-data'
import { ApiError } from '@/types/errors'
import { logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'
import { SandboxWithMetrics } from '@/features/dashboard/sandboxes/table-config'

const GetTeamSandboxesParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamSandboxes = guard(
  GetTeamSandboxesParamsSchema,
  async ({ teamId }) => {
    if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
      await new Promise((resolve) => setTimeout(resolve, 200))

      const sandboxes = MOCK_SANDBOXES_DATA()
      const metrics = MOCK_METRICS_DATA(sandboxes)

      return sandboxes.map((sandbox) => ({
        ...sandbox,
        metrics: [metrics.get(sandbox.sandboxID)!],
      }))
    }

    const { user } = await checkAuthenticated()
    const apiKey = await getTeamApiKey(user.id, teamId)
    const { url } = await getApiUrl()

    const res = await fetch(`${url}/sandboxes/metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    })

    if (!res.ok) {
      const json = await res.json()

      logger.error(ERROR_CODES.INFRA, '/sandboxes/metrics', json)

      // this case should never happen for the original reason, hence we assume the user defined the wrong infra domain
      throw ApiError(
        "Something went wrong when contacting the API. Ensure you are using the correct Infrastructure Domain under 'Developer Settings'"
      )
    }

    const json = (await res.json()) as SandboxWithMetrics[]

    return json
  }
)
