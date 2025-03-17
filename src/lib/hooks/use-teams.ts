import { useMemo } from 'react'
import { useServerContext } from './use-server-context'

export const useTeams = () => {
  const { teams } = useServerContext()

  return { teams }
}

export const useSelectedTeam = () => {
  const { teams, selectedTeamId } = useServerContext()

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  )

  return selectedTeam
}
