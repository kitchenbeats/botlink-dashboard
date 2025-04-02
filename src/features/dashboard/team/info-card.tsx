'use client'

import { Input } from '@/ui/primitives/input'
import { Skeleton } from '@/ui/primitives/skeleton'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import { Badge } from '@/ui/primitives/badge'
import CopyButton from '@/ui/copy-button'

interface InfoCardProps {
  className?: string
}

export function InfoCard({ className }: InfoCardProps) {
  const team = useSelectedTeam()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Information</CardTitle>
        <CardDescription>
          Additional information about this team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {team ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent">E-Mail</Badge>
              <span>{team.email}</span>
              <CopyButton
                value={team.email}
                variant="ghost"
                className="size-5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="muted">Team ID</Badge>
              <span className="text-fg-500">{team.id}</span>
              <CopyButton
                value={team.id}
                variant="ghost"
                className="text-fg-500 size-5"
              />
            </div>
          </div>
        ) : (
          <Skeleton className="h-10 w-[17rem]" />
        )}
      </CardContent>
    </Card>
  )
}
