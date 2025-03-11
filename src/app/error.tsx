'use client'

import { createErrorBoundary } from '@/lib/create-error-boundary'

export default createErrorBoundary({
  title: 'Something went wrong',
  description: 'An unexpected error occurred',
})
