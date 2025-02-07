'use client'

import { Input } from '@/ui/primitives/input'
import { cn } from '@/lib/utils'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/primitives/command'
import { useEffect, useState } from 'react'
import { MAIN_DASHBOARD_LINKS } from '@/configs/dashboard-navs'
import { useRouter } from 'next/navigation'
import { Kbd } from '@/ui/primitives/kbd'
import { useSelectedTeam } from '@/lib/hooks/use-teams'

interface SearchProps {
  className?: string
}

export default function Search({ className }: SearchProps) {
  const [open, setOpen] = useState(false)
  const selectedTeam = useSelectedTeam()
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }
      },
      { signal: controller.signal }
    )

    return () => controller.abort()
  }, [])

  return (
    <div className="relative">
      <Input
        className={cn('h-10 w-full border-none pr-12', className)}
        placeholder="QUICK NAVIGATE"
        onClick={() => setOpen(true)}
        readOnly
      />
      <Kbd
        keys={['cmd', 'k']}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Quick Jump to..." />
        <CommandList className="p-1 pb-3">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {MAIN_DASHBOARD_LINKS.map((link) => (
              <CommandItem
                key={link.label}
                onSelect={() => {
                  router.push(
                    link.href({
                      teamIdOrSlug:
                        selectedTeam?.slug ?? selectedTeam?.id ?? undefined,
                    })
                  )
                  setOpen(false)
                }}
                className="group"
              >
                <link.icon className="!size-4 text-fg-500 group-[&[data-selected=true]]:text-accent" />
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
