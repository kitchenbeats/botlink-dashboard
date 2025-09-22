'use client'

import { SandboxesListResponse } from '@/app/api/teams/[teamId]/sandboxes/list/types'
import { Sandboxes } from '@/types/api'
import useSWR from 'swr'
import { useDashboard } from '../../../context'

interface UseSandboxesProps {
  initialSandboxes?: Sandboxes
  pollingInterval?: number
}

export function useSandboxes({
  initialSandboxes,
  pollingInterval = 15_000,
}: UseSandboxesProps) {
  const { team } = useDashboard()

  const swr = useSWR<SandboxesListResponse>(
    team ? [`/api/teams/${team?.id}/sandboxes/list`] : [],
    async ([url]: [string]) => {
      if (!url) {
        return {
          sandboxes: initialSandboxes || [],
        }
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const { error } = await response.json()

        throw new Error(error || 'Failed to fetch metrics')
      }

      return (await response.json()) as SandboxesListResponse
    },
    {
      refreshInterval: pollingInterval,
      shouldRetryOnError: true,
      errorRetryCount: 100,
      errorRetryInterval: pollingInterval,
      revalidateOnMount: false,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      fallbackData: initialSandboxes
        ? { sandboxes: initialSandboxes }
        : undefined,
    }
  )

  return swr
}
