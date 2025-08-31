'use client'

import { ClientTeam } from '@/types/dashboard.types'
import { useEffect } from 'react'
import useSWR from 'swr'

interface UseTeamProps {
  initialData: ClientTeam | null
}

export const useTeam = (
  { initialData }: UseTeamProps = { initialData: null }
) => {
  // at the moment we only refetch via initial (server) revalidation
  // swr is a good global state management solution for this
  const swr = useSWR<ClientTeam | null>(
    ['user-team', initialData?.id],
    async () => {
      return initialData
    },
    {
      fallbackData: initialData,
      keepPreviousData: true,
    }
  )

  console.log('initialData', initialData)

  useEffect(() => {
    console.log('swr.data', swr.data)
  }, [swr.data])

  return {
    ...swr,
    team: swr.data,
  }
}
