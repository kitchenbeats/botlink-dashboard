'use client'

import ErrorBoundary from '@/ui/error'

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <ErrorBoundary
      description="Sorry, something went wrong with the application."
      error={error}
    />
  )
}
