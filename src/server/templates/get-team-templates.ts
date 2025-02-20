import 'server-only'

import {
  checkAuthenticated,
  getApiUrl,
  getUserAccessToken,
} from '@/lib/utils/server'
import { z } from 'zod'
import { guard } from '@/lib/utils/server'
import { Template } from '@/types/api'
import { MOCK_TEMPLATES_DATA } from '@/configs/mock-data'
import { ApiError, InvalidApiKeyError } from '@/types/errors'
import { logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'

const GetTeamTemplatesParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamTemplates = guard(
  GetTeamTemplatesParamsSchema,
  async ({ teamId }) => {
    if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_TEMPLATES_DATA
    }

    const { user } = await checkAuthenticated()
    const accessToken = await getUserAccessToken(user.id)
    const { url } = await getApiUrl()

    const res = await fetch(`${url}/templates?teamID=${teamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      logger.error(ERROR_CODES.INFRA, '/templates', res)

      // this case should never happen for the described reason, hence we assume the user defined the wrong infra domain
      throw ApiError(
        "Something went wrong when contacting the API. Ensure you are using the correct Infrastructure Domain under 'Developer Settings'"
      )
    }

    const data = (await res.json()) as Template[]

    return data
  }
)
