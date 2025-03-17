import 'server-only'

import { getUserAccessToken } from '@/lib/utils/server'
import { z } from 'zod'
import { BillingLimit } from '@/types/billing'
import { USER_ACCESS_TOKEN_HEADER } from '@/configs/constants'
import { authActionClient } from '@/lib/clients/action'

const GetBillingLimitsParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getBillingLimits = authActionClient
  .schema(GetBillingLimitsParamsSchema)
  .metadata({ serverFunctionName: 'getBillingLimits' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const accessToken = await getUserAccessToken(user.id)

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${teamId}/billing-limits`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [USER_ACCESS_TOKEN_HEADER]: accessToken,
        },
      }
    )

    if (!res.ok) {
      const text = await res.text()

      throw new Error(
        text ??
          `Failed to fetch billing endpoint: /teams/${teamId}/billing-limits`
      )
    }

    const limit = (await res.json()) as BillingLimit

    return limit
  })
