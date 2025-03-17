import 'server-only'

import { Invoice } from '@/types/billing'
import { getTeamApiKey, getUserAccessToken } from '@/lib/utils/server'
import { z } from 'zod'
import {
  TEAM_API_KEY_HEADER,
  USER_ACCESS_TOKEN_HEADER,
} from '@/configs/constants'
import { authActionClient } from '@/lib/clients/action'

const GetInvoicesParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getInvoices = authActionClient
  .schema(GetInvoicesParamsSchema)
  .metadata({ serverFunctionName: 'getInvoices' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const apiKey = await getTeamApiKey(user.id, teamId)

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${teamId}/invoices`,
      {
        headers: {
          [TEAM_API_KEY_HEADER]: apiKey,
        },
      }
    )

    if (!res.ok) {
      const text = await res.text()

      throw new Error(
        text ?? `Failed to fetch billing endpoint: /teams/${teamId}/invoices`
      )
    }

    const invoices = (await res.json()) as Invoice[]

    return invoices
  })
