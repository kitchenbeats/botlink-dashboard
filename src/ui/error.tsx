'use client'

import { useEffect } from 'react'
import { ErrorIndicator } from './error-indicator'
import { logError } from '@/lib/clients/logger'
import Frame from './frame'
import { cn } from '@/lib/utils'
import * as Sentry from '@sentry/nextjs'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

export default function ErrorBoundary({
  error,
  description,
  className,
}: {
  error: Error & { digest?: string }
  description?: string
  className?: string
}) {
  useEffect(() => {
    if (Sentry.isInitialized()) {
      Sentry.captureException(error, {
        level: 'fatal',
        tags: {
          component: 'ErrorBoundary',
        },
      })
    } else {
      logError('Error boundary caught:', error)
    }
  }, [error])

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className
      )}
    >
      <Frame>
        <ErrorIndicator
          description={description}
          message={error.message}
          className="border-none"
        />
      </Frame>
    </div>
  )
}

export function CatchErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReactErrorBoundary
      fallbackRender={({ error }) => <ErrorBoundary error={error} />}
    >
      {children}
    </ReactErrorBoundary>
  )
}
