'use client'

import { Button } from '@/ui/primitives/button'
import { findNeighbour } from 'fumadocs-core/server'
import { useTreeContext } from 'fumadocs-ui/provider'
import { MoveLeft, MoveRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const tree = useTreeContext()
  const path = usePathname()

  const neighbours = findNeighbour(tree.root, path)

  const className =
    'max-w-[45%] whitespace-break-spaces py-2 h-min font-sans normal-case gap-3'

  return (
    <footer className="flex flex-row justify-between">
      {neighbours.previous && (
        <Button variant="outline" className={className} size="lg" asChild>
          <Link href={neighbours.previous.url}>
            <MoveLeft className="text-fg-300 size-4" />
            {neighbours.previous.name}
          </Link>
        </Button>
      )}
      {neighbours.next && (
        <Button variant="outline" className={className} size="lg" asChild>
          <Link href={neighbours.next.url}>
            {neighbours.next.name}
            <MoveRight className="text-fg-300 size-4" />
          </Link>
        </Button>
      )}
    </footer>
  )
}
