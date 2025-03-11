import '@/app/_fonts/fonts'
import '@/styles/globals.css'

import { Body } from './layout.client'
import { BASE_URL } from '@/configs/urls'
import { Metadata } from 'next/types'
import { METADATA } from '@/configs/metadata'
import ClientProviders from '@/features/client-providers'
import { Suspense } from 'react'
import { GeneralAnalyticsCollector } from '@/features/general-analytics-collector'
import { Toaster } from '@/ui/primitives/toaster'
import Head from 'next/head'
import { GTMHead } from '@/features/google-tag-manager'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s - E2B',
    default: METADATA.title,
  },
  description: 'Open-source secure sandboxes for AI code execution',
  twitter: {
    title: METADATA.title,
    description: METADATA.description,
  },
  openGraph: {
    title: METADATA.title,
    description: METADATA.description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <GTMHead />
      </Head>
      <Body>
        <ClientProviders>
          {children}
          <Suspense>
            <GeneralAnalyticsCollector />
            <Toaster />
          </Suspense>
        </ClientProviders>
      </Body>
    </html>
  )
}
