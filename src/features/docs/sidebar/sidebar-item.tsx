'use client'

import React from 'react'
import { PageTree } from 'fumadocs-core/server'
import { cn, exponentialSmoothing } from '@/lib/utils'
import { isActive } from '@/lib/utils/docs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/ui/primitives/button'

const variants = {
  container: {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      marginBottom: 0,
      transition: {
        duration: 0.15,
        ease: exponentialSmoothing(5),
      },
    },
    show: {
      opacity: 1,
      height: 'auto',
      marginBottom: '0.3rem',
      transition: {
        height: {
          duration: 0.15,
        },
        staggerChildren: 0.07,
        ease: exponentialSmoothing(5),
      },
    },
  } satisfies Variants,

  item: {
    hidden: { opacity: 0, x: -4 },
    show: { opacity: 1, x: 0 },
  } satisfies Variants,
}

interface SidebarItemProps {
  item: PageTree.Node
  level?: number
}

export default function SidebarItem({ item, level = 0 }: SidebarItemProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(true)

  if (item.type === 'separator') {
    return (
      <p className="mt-8 mb-2 font-mono text-[0.65rem] uppercase first:mt-0">
        {item.name}
      </p>
    )
  }

  if (item.type === 'folder') {
    const active = item.index?.url && pathname.startsWith(item.index?.url)

    return (
      <div className="bg-bg-100 mb-2 flex flex-col border">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-start gap-1"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-fg-300"
          >
            <ChevronRight className="text-fg-500 size-4" />
          </motion.div>
          <span
            className={cn(
              'truncate text-xs font-medium',
              active && 'text-accent'
            )}
          >
            {item.name}
          </span>
        </Button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              variants={variants.container}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="flex flex-col overflow-hidden border-t pl-2"
            >
              {item.children?.map((child, index) => (
                <motion.div variants={variants.item} key={index}>
                  <SidebarItem item={child} level={level + 1} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Regular item (link)
  const active = isActive(item.url, pathname, false)

  return (
    <Link
      href={item.url}
      className={cn(
        'group text-fg-500 hover:text-fg flex w-full items-center pl-1 font-mono text-xs hover:no-underline',
        active && 'text-fg'
      )}
    >
      <div className="flex w-full items-center gap-1 py-1">
        {item.icon}
        <span className="shrink-0">{item.name}</span>
      </div>
    </Link>
  )
}
