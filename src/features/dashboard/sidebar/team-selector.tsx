'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/ui/primitives/select'
import { useSelectedTeam, useTeams } from '@/lib/hooks/use-teams'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { PROTECTED_URLS } from '@/configs/urls'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import { Skeleton } from '@/ui/primitives/skeleton'
import ClientOnly from '@/ui/client-only'
import { CreateTeamDialog } from './create-team-dialog'
import { Button } from '@/ui/primitives/button'
import { Plus } from 'lucide-react'
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types'

interface TeamSelectorProps {
  className?: string
}

export default function TeamSelector({ className }: TeamSelectorProps) {
  const { teams: loadedTeams } = useTeams()
  const selectedTeam = useSelectedTeam()
  const router = useRouter()
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)

  const defaultTeam = useMemo(
    () => loadedTeams.find((team) => team.is_default),
    [loadedTeams]
  )

  const teams = useMemo(
    () => loadedTeams.filter((team) => team.id !== defaultTeam?.id) ?? [],
    [loadedTeams, defaultTeam]
  )

  const prefetchTeamRoutes = () => {
    loadedTeams.forEach((team) => {
      const route = PROTECTED_URLS.SANDBOXES(team.slug || team.id)

      router.prefetch(route, {
        kind: PrefetchKind.FULL,
      })
    })
  }

  return (
    <>
      <Select
        value={selectedTeam?.id}
        onValueChange={(teamId) => {
          const team = loadedTeams.find((team) => team.id === teamId)

          router.push(PROTECTED_URLS.SANDBOXES(team?.slug || teamId))
          router.refresh()
        }}
        onOpenChange={(open) => {
          if (open) {
            prefetchTeamRoutes()
          }
        }}
      >
        <SelectTrigger
          className={cn(
            'hover:bg-bg-100 h-auto w-full rounded-sm border-0 px-2 py-1 pr-4',
            className
          )}
        >
          <div className="flex flex-1 items-center gap-2">
            <Avatar className="size-9 shrink-0 border-none drop-shadow-lg filter">
              <AvatarImage
                src={selectedTeam?.profile_picture_url || undefined}
                className=""
              />
              <AvatarFallback className="bg-bg-100">
                {selectedTeam?.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <ClientOnly className="h-full w-full">
              <div className="flex max-w-[160px] flex-1 flex-col items-start gap-1 overflow-hidden pb-px text-left [&>span]:max-w-full [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap">
                <span className="text-accent -mb-1 w-full text-left text-[0.65rem]">
                  TEAM
                </span>
                {selectedTeam ? (
                  <SelectValue placeholder="No team selected" />
                ) : (
                  <Skeleton className="h-4 w-full" />
                )}
              </div>
            </ClientOnly>
          </div>
        </SelectTrigger>
        <SelectContent collisionPadding={0} className="p-0">
          {defaultTeam && (
            <SelectGroup className="w-full px-2 pb-1 first:pt-2">
              <SelectLabel>Personal</SelectLabel>
              <SelectItem
                key={defaultTeam.id}
                value={defaultTeam.id}
                className="max-w-[280px] [&>*]:truncate"
              >
                {defaultTeam.name}
              </SelectItem>
            </SelectGroup>
          )}
          {teams.length > 0 && (
            <>
              <SelectGroup className="w-full px-2 pt-1 pb-2">
                <SelectLabel>Teams</SelectLabel>
                {teams.map((team) => (
                  <SelectItem
                    key={team.id}
                    value={team.id}
                    className="max-w-[280px] [&>*]:truncate"
                  >
                    {team.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
          <SelectSeparator />
          <div className="p-1 pb-2">
            <Button
              variant="link"
              className="w-full justify-end"
              onClick={() => setIsCreateTeamOpen(true)}
            >
              <Plus className="size-4" /> Create Team
            </Button>
          </div>
        </SelectContent>
      </Select>
      <CreateTeamDialog
        open={isCreateTeamOpen}
        onOpenChange={setIsCreateTeamOpen}
      />
    </>
  )
}
