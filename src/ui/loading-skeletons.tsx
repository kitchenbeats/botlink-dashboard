import { cn } from '@/lib/utils'

/**
 * Generic full-page skeleton loader
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center min-h-screen', className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    </div>
  )
}

/**
 * Dashboard layout skeleton - matches the sidebar + content layout
 */
export function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-dvh min-w-dvw flex max-h-full w-full flex-col overflow-hidden">
      <div className="flex h-full max-h-full min-h-0 w-full flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col gap-2 p-4">
            {/* Logo skeleton */}
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            {/* Nav items skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header skeleton */}
          <div className="border-b border-gray-200 p-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Content skeleton */}
          <div className="flex-1 p-6">
            <div className="space-y-4">
              <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Admin page skeleton
 */
export function AdminPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-6xl p-6 space-y-6">
        {/* Title skeleton */}
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Sandbox inspect page skeleton
 */
export function SandboxInspectSkeleton() {
  return (
    <div className="sticky top-0 flex flex-1 gap-4 overflow-hidden p-3 md:p-6">
      {/* File tree skeleton */}
      <div className="w-64 border border-gray-200 rounded-lg p-4 space-y-2">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>

      {/* Viewer skeleton */}
      <div className="flex-1 border border-gray-200 rounded-lg p-4">
        <div className="h-full bg-gray-50 rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Table page skeleton (for list pages like projects, templates, etc)
 */
export function TablePageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with title and action */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Search/filter bar */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-200 p-4">
            <div className="flex gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Simple centered loading spinner
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
    </div>
  )
}

/**
 * Card skeleton for dashboard widgets
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-gray-200 rounded-lg p-6 space-y-4', className)}>
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-20 bg-gray-100 rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  )
}
