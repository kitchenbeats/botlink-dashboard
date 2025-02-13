'use client'

import { useEffect } from 'react'
import { ErrorIndicator } from './error-indicator'
import { logger } from '@/lib/clients/logger'
import Frame from './frame'
import { cn } from '@/lib/utils'

// TODO: log error to sentry

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
    logger.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <Frame>
        <ErrorIndicator description={description} message={error.message} />
      </Frame>
    </div>
  )
}
