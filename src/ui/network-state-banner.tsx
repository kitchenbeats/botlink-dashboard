'use client'

import { exponentialSmoothing } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useState } from 'react'

export default function NetworkStateBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline === undefined) return null

  return (
    <AnimatePresence initial={false}>
      {!isOnline && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.2, ease: exponentialSmoothing(5) }}
          className="w-full overflow-hidden border-b border-red-500/20 bg-red-500/10"
          suppressHydrationWarning
        >
          <div className="container mx-auto px-4 py-2">
            <p className="text-center text-sm font-medium text-red-500">
              You are currently offline.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
