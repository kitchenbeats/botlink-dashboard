import 'server-only'

import { z } from 'zod'
import { MOCK_METRICS_DATA, MOCK_SANDBOXES_DATA } from '@/configs/mock-data'
import { ApiError } from '@/types/errors'
import { logError, logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'
import { SandboxWithMetrics } from '@/features/dashboard/sandboxes/table-config'
import { authActionClient, returnServerError } from '@/lib/clients/action'
import { getApiUrl, getTeamApiKey } from '@/lib/utils/server'

const GetTeamSandboxesSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamSandboxes = authActionClient
  .schema(GetTeamSandboxesSchema)
  .metadata({ serverFunctionName: 'getTeamSandboxes' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
      await new Promise((resolve) => setTimeout(resolve, 200))

      const sandboxes = MOCK_SANDBOXES_DATA()
      const metrics = MOCK_METRICS_DATA(sandboxes)

      return sandboxes.map((sandbox) => ({
        ...sandbox,
        metrics: [metrics.get(sandbox.sandboxID)!],
      }))
    }

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
      const content = await res.text()
      logError(ERROR_CODES.INFRA, '/sandboxes/metrics', content)

      // this case should never happen for the original reason, hence we assume the user defined the wrong infra domain
      return returnServerError(
        "Something went wrong when contacting the API. Ensure you are using the correct Infrastructure Domain under 'Developer Settings'"
      )
    }

    const json = (await res.json()) as SandboxWithMetrics[]

    return json
  })
