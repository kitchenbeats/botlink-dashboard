import { useServerContext } from '../../features/dashboard/server-context'

export const useTeams = () => {
  const { teams } = useServerContext()
  return { teams }
}

export const useCurrentTeam = () => {
  const { currentTeam } = useServerContext()
  return currentTeam
}

// Backwards compatibility alias
export const useSelectedTeam = useCurrentTeam
