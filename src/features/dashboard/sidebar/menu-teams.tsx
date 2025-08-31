import { UserTeamsResponse } from '@/app/api/teams/user/types'
import { useTeam } from '@/lib/hooks/use-team'
import { useUser } from '@/lib/hooks/use-user'
import { ClientTeam } from '@/types/dashboard.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/ui/primitives/dropdown-menu'
import { Loader } from '@/ui/primitives/loader'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import useSWR from 'swr'

export default function DashboardSidebarMenuTeams() {
  const router = useRouter()

  const { user } = useUser()
  const { team } = useTeam()

  const { data: teams, isLoading } = useSWR<ClientTeam[] | null>(
    ['/api/teams/user', user?.id],
    async ([url, userId]: [string, string | undefined]) => {
      if (!userId) {
        return null
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`)
      }

      const { teams } = (await response.json()) as UserTeamsResponse

      return teams
    },
    {
      keepPreviousData: true,
    }
  )

  if (isLoading) {
    return <Loader />
  }

  const handleTeamChange = useCallback(
    async (teamId: string) => {
      const team = teams?.find((t) => t.id === teamId)

      if (!team) return

      await fetch('/api/team/state', {
        method: 'POST',
        body: JSON.stringify({ teamId: team.id, teamSlug: team.slug }),
      })

      router.refresh()
    },
    [teams, router]
  )

  return (
    <DropdownMenuRadioGroup value={team?.id} onValueChange={handleTeamChange}>
      {user?.email && (
        <DropdownMenuLabel className="mb-2">{user.email}</DropdownMenuLabel>
      )}
      {teams?.length && teams.length > 0 ? (
        teams.map((team) => (
          <DropdownMenuRadioItem key={team.id} value={team.id}>
            <Avatar className="size-5 shrink-0 border-none">
              <AvatarImage src={team.profile_picture_url || undefined} />
              <AvatarFallback className="group-focus:text-accent-main-highlight text-fg-tertiary text-xs">
                {team.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate font-sans prose-label-highlight">
              {team.transformed_default_name || team.name}
            </span>
          </DropdownMenuRadioItem>
        ))
      ) : (
        <DropdownMenuItem disabled>No teams available</DropdownMenuItem>
      )}
    </DropdownMenuRadioGroup>
  )
}
