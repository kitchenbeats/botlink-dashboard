'use client'

import '@/styles/docs.css'

import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { baseOptions } from '@/app/layout.config'
/* import "fumadocs-twoslash/twoslash.css"; */
import { source } from '@/app/source'
import { Nav } from '@/features/docs/navbar/navbar'
import Sidebar from '@/features/docs/sidebar/sidebar'
/* import { Trigger } from "@/components/ai/search-ai"; */

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  sidebar: {
    component: <Sidebar />,
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col">
      <Nav className="fixed inset-x-0 top-0" />
      <div className="max-h-full flex-1 overflow-y-auto pt-[var(--fd-nav-height)]">
        <div className="container mx-auto w-full">
          <DocsLayout {...docsOptions}>{children}</DocsLayout>
        </div>
      </div>
    </div>
  )
}
