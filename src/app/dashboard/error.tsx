'use client'

import ErrorBoundary from '@/ui/error'

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <ErrorBoundary
      error={error}
      description={'An Unexpected Error Occurred'}
      className="min-h-svh"
    />
  )
}
