'use client'

import { SentryErrorBoundary } from '@/ui/sentry-error-boundary'

interface CreateErrorBoundaryOptions {
  title?: string
  description?: string
}

/**
 * Helper function to create error.tsx files for any route in the application
 *
 * Usage:
 * ```
 * // src/app/some-route/error.tsx
 * export default createErrorBoundary({
 *   title: 'Route Error',
 *   description: 'Something went wrong in this route'
 * })
 * ```
 */
export function createErrorBoundary(options: CreateErrorBoundaryOptions = {}) {
  return function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
    return (
      <SentryErrorBoundary
        error={error}
        title={options.title}
        description={options.description}
        resetErrorBoundary={reset}
        preserveLayout={true}
      />
    )
  }
}
