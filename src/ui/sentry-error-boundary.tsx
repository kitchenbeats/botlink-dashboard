'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ErrorIndicator } from '@/ui/error-indicator'
import { useRouter } from 'next/navigation'

interface SentryErrorBoundaryProps {
  error: Error & { digest?: string }
  title?: string
  description?: string
  resetErrorBoundary?: () => void
  preserveLayout?: boolean
}

export function SentryErrorBoundary({
  error,
  title = 'Something went wrong',
  description = 'Sorry, an unexpected error has occurred.',
  resetErrorBoundary,
  preserveLayout = true,
}: SentryErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    // Automatically report all errors to Sentry
    Sentry.captureException(error)
  }, [error])

  const handleReset = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary()
    } else {
      router.refresh()
    }
  }

  // If we're preserving the layout, just render the error component
  if (preserveLayout) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <ErrorIndicator
          title={title}
          description={description}
          message={error.message || 'An unexpected error occurred.'}
          className="w-full"
        />
      </div>
    )
  }

  // For global errors that replace the entire page
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-4">
        <ErrorIndicator
          title={title}
          description={description}
          message={error.message || 'An unexpected error occurred.'}
          className="w-full"
        />
      </body>
    </html>
  )
}
