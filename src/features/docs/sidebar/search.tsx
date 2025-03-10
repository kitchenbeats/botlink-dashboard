'use client'

import { cn } from '@/lib/utils'
import { Kbd } from '@/ui/primitives/kbd'
import { Button } from '@/ui/primitives/button'
import { useSearchContext } from 'fumadocs-ui/provider'

interface SearchProps {
  className?: string
}

export default function Search({ className }: SearchProps) {
  const { setOpenSearch } = useSearchContext()

  return (
    <div className="relative">
      <Button
        variant="outline"
        className={cn(
          'text-fg-300 h-10 w-full justify-start text-xs',
          className
        )}
        onClick={() => setOpenSearch(true)}
      >
        SEARCH
      </Button>
      <Kbd
        keys={['cmd', 'k']}
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
      />
    </div>
  )
}
