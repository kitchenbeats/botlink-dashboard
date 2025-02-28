'use client'

import { SentryErrorBoundary } from '@/ui/sentry-error-boundary'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <SentryErrorBoundary
      error={error}
      title="Application Error"
      description="Sorry, something went wrong with the application."
      preserveLayout={false}
    />
  )
}
