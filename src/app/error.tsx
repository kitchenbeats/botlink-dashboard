'use client'

import { UnknownError } from '@/types/errors'
import ErrorBoundary from '@/ui/error'

export default function Error() {
  return (
    <ErrorBoundary
      error={UnknownError()}
      description={'An Unexpected Error Occurred'}
      className="min-h-svh"
    />
  )
}
