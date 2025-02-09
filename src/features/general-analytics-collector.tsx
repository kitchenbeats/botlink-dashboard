'use client'

import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { useUser } from '@/lib/hooks/use-user'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function GeneralAnalyticsCollector() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  const { user } = useUser()
  /*   const selectedTeam = useSelectedTeam(); */

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) url = url + `?${searchParams.toString()}`
      posthog?.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, posthog])

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
