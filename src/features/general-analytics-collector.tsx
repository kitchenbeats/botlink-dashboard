'use client'

import { useUser } from '@/lib/hooks/use-user'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function GeneralAnalyticsCollector() {
  const posthog = usePostHog()
  const { user } = useUser()
  /*   const selectedTeam = useSelectedTeam(); */

  useEffect(() => {
    if (user) {
      posthog?.identify(user.id, { email: user.email })

      /*       if (!selectedTeam) return;

      posthog?.group("team", selectedTeam.id, {
        name: selectedTeam.name,
      }); */
    }
  }, [user, posthog])

  return null
}
