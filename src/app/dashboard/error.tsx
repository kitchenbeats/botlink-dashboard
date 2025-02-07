'use client'

import { UnknownError } from '@/types/errors'
import ErrorBoundary from '@/ui/error'

export default function DashboardError() {
  return (
    <ErrorBoundary
      error={UnknownError()}
      description={'An Unexpected Error Occurred'}
    />
  )
}
