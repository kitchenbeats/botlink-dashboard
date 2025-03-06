import { QUERY_KEYS } from '@/configs/keys'
import { useMemo } from 'react'
import useSWR, { preload } from 'swr'
import { TeamWithDefault } from '@/types/dashboard'
import { useServerContext } from './use-server-context'
import { useUser } from './use-user'

// Fetcher function extracted so we can use it for preloading
const teamsFetcher = async () => {
  const response = await fetch('/api/teams/user')

  const json = await response.json()

  if (!response.ok) {
    throw new Error(json.error)
  }

  return json as TeamWithDefault[]
}

// Preload teams data - call this as early as possible (e.g., in your root layout)
export const preloadTeams = () => {
  preload(QUERY_KEYS.TEAMS(), teamsFetcher)
}

export const useTeams = () => {
  const { user } = useUser()

  const { data, error, isLoading, mutate } = useSWR(
    user ? QUERY_KEYS.TEAMS() : null,
    user ? teamsFetcher : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      revalidateIfStale: true,
      errorRetryCount: 3,
      ttl: 24 * 60 * 60 * 1000,
      suspense: true,
      fallbackData: [],
    }
  )

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
    teams: data ?? [],
    refetch: () => {
      return mutate()
    },
  }
}

export const useSelectedTeam = () => {
  const { teams } = useTeams()
  const { selectedTeamId } = useServerContext()

  const team = useMemo(
    () => teams?.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  )

  return team
}
