'use client'

import useIsMounted from '@/lib/hooks/use-is-mounted'
import { AnimatePresence, motion } from 'motion/react'

export default function ClientOnly({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMounted = useIsMounted()

  return (
    <AnimatePresence>
      {isMounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
