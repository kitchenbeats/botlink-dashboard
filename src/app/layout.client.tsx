'use client'

import { GTMBody } from '@/features/google-tag-manager'
import { cn } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Script from 'next/script'
import { type ReactNode } from 'react'

export function Body({
  children,
}: {
  children: ReactNode
}): React.ReactElement<unknown> {
  const mode = useMode()

  return (
    <body className={cn(mode, 'relative flex min-h-[100svh] flex-col')}>
      {process.env.NEXT_PUBLIC_SCAN && process.env.NEXT_PUBLIC_SCAN === '1' && (
        <Script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      )}
      <GTMBody />
      {children}
    </body>
  )
}

export function useMode(): string | undefined {
  const { slug } = useParams()
  return Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined
}
