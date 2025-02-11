import { DebouncedInput } from '@/ui/primitives/input'
import { cn } from '@/lib/utils'
import React, { useEffect } from 'react'
import { useSandboxTableStore } from '@/features/dashboard/sandboxes/stores/table-store'
import { Kbd } from '@/ui/primitives/kbd'

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  {
    className?: string
  }
>(({ className }, ref) => {
  const { setGlobalFilter, globalFilter } = useSandboxTableStore()

  useEffect(() => {
    const controller = new AbortController()

    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === '/') {
          e.preventDefault()
          if (ref && 'current' in ref) {
            ;(ref as React.RefObject<HTMLInputElement | null>).current?.focus()
          }
          return true
        }
      },
      { signal: controller.signal }
    )

    return () => controller.abort()
  }, [ref])

  return (
    <div className={cn('relative w-full', className)}>
      <DebouncedInput
        value={globalFilter}
        onChange={(v) => setGlobalFilter(v as string)}
        placeholder="Find a sandbox..."
        className="h-10 w-full pr-14"
        ref={ref}
        debounce={500}
      />
      <Kbd keys={['/']} className="absolute right-2 top-1/2 -translate-y-1/2" />
    </div>
  )
})

SearchInput.displayName = 'SearchInput'
