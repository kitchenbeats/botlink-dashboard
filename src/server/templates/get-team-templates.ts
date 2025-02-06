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
import { InvalidApiKeyError } from '@/types/errors'

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
      const text = await res.text()

      if (res.status === 401) {
        // this case should never happen for the described reason, hence we assume the user defined the wrong infra domain
        throw InvalidApiKeyError(
          "Authorization failed. Ensure you are using the correct Infrastructure Domain under 'Developer Settings'"
        )
      }

      throw new Error(
        text ?? `Failed to fetch api endpoint: /templates?teamID=${teamId}`
      )
    }

    const data = (await res.json()) as Template[]

    return data
  }
)
