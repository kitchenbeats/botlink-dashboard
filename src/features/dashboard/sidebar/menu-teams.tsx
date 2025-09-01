import { UserTeamsResponse } from '@/app/api/teams/user/types'
import { ClientTeam } from '@/types/dashboard.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/ui/primitives/dropdown-menu'
import { Loader } from '@/ui/primitives/loader'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import useSWR from 'swr'
import { useDashboard } from '../context'

export default function DashboardSidebarMenuTeams() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, team, setTeam } = useDashboard()

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

  const generateTeamLink = useCallback(
    (team: ClientTeam) => {
      const splitPath = pathname.split('/')
      splitPath[2] = team.slug

      return splitPath.join('/')
    },
    [pathname]
  )

  const handleValueChange = useCallback(
    (value: string) => {
      const team = teams?.find((t) => t.id === value)
      if (team) {
        setTeam(team)
        router.push(generateTeamLink(team))
      }
    },
    [teams, generateTeamLink, router, setTeam]
  )

  if (isLoading) {
    return <Loader />
  }

  return (
    <DropdownMenuRadioGroup value={team?.id} onValueChange={handleValueChange}>
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
