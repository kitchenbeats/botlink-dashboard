'use client'

import { PROTECTED_URLS } from '@/configs/urls'
import { useTeam } from '@/lib/hooks/use-team'
import { ClientTeam } from '@/types/dashboard.types'
import { Button } from '@/ui/primitives/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/ui/primitives/card'
import { ArrowLeft, HomeIcon, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface TeamGateClientProps {
  children: React.ReactNode
  initialTeam: ClientTeam | null
}

export default function TeamGateClient({
  children,
  initialTeam,
}: TeamGateClientProps) {
  const { data: team } = useTeam({ initialData: initialTeam })

  if (!team) {
    return <TeamNotFound />
  }

  return children
}

function TeamNotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md border border-stroke bg-bg-1/40 backdrop-blur-lg">
        <CardHeader className="text-center">
          <span className="prose-value-big">403</span>
          <CardDescription>Team not found or access denied.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-fg-secondary">
          <p>
            The team you are looking for might not exist or you don't have
            permission to access it.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <div className="flex w-full justify-between gap-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/" className="gap-2">
                <HomeIcon className="h-4 w-4 text-fg-tertiary" />
                Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href={PROTECTED_URLS.DASHBOARD} className="gap-2">
                <LayoutDashboard className="h-4 w-4 text-fg-tertiary" />
                Dashboard
              </Link>
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4 text-fg-tertiary" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
