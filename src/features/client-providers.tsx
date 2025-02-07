'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useLayoutEffect } from 'react'
import { preloadTeams } from '@/lib/hooks/use-teams'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { RootProvider } from 'fumadocs-ui/provider'
import { TooltipProvider } from '@/ui/primitives/tooltip'
import { ToastProvider } from '@/ui/primitives/toast'
import { Toaster } from '@/ui/primitives/toaster'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  useLayoutEffect(() => {
    preloadTeams()
  }, [])

  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        <RootProvider
          theme={{
            attribute: 'class',
            defaultTheme: 'system',
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          <TooltipProvider>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </RootProvider>
      </QueryClientProvider>
    </PostHogProvider>
  )
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      // Note that PostHog will automatically capture page views and common events
      api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
      disable_session_recording: process.env.NODE_ENV !== 'production',
      advanced_disable_toolbar_metrics: true,
      opt_in_site_apps: true,
      capture_pageview: false, // we are handling this ourselves
      loaded: (posthog) => {
        // console.log('PostHog loaded', process.env.NODE_ENV)
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
