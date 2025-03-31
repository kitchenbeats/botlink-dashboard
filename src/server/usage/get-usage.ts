import 'server-only'

import { Usage, TransformedUsageData } from '@/server/usage/types'
import { z } from 'zod'
import { authActionClient } from '@/lib/clients/action'
import { returnServerError } from '@/lib/utils/action'
import { SUPABASE_AUTH_HEADERS } from '@/configs/constants'

const GetUsageSchema = z.object({
  teamId: z.string().uuid(),
})

export const getUsage = authActionClient
  .schema(GetUsageSchema)
  .metadata({ serverFunctionName: 'getUsage' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const response = await fetch(
      `${process.env.BILLING_API_URL}/teams/${teamId}/usage`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(session.access_token, teamId),
        },
      }
    )

    if (!response.ok) {
      const text = await response.text()
      return returnServerError(text ?? 'Failed to fetch usage data')
    }

    const data = await response.json()

    return {
      ...transformUsageData(data.usages),
      credits: data.credits as number,
    }
  })

function transformUsageData(usages: Usage[]): TransformedUsageData {
  const ramData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, '0')}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.ram_gb_hours,
      0
    ),
  }))

  const vcpuData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, '0')}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.sandbox_hours,
      0
    ),
  }))

  const costData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, '0')}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.total_cost,
      0
    ),
  }))

  return {
    vcpuSeries: [
      {
        id: 'vCPU Hours',
        data: vcpuData,
      },
    ],
    ramSeries: [
      {
        id: 'RAM Usage',
        data: ramData,
      },
    ],
    costSeries: [
      {
        id: 'Cost',
        data: costData,
      },
    ],
  }
}
