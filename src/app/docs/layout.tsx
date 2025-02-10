'use client'

import '@/styles/docs.css'

import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { baseOptions } from '@/app/layout.config'
/* import "fumadocs-twoslash/twoslash.css"; */
import { source } from '@/app/source'
import DocsNavItem from '@/features/docs/navbar/item'
import DocsNavSeparator from '@/features/docs/navbar/separator'
import DocsNavHeader from '@/features/docs/navbar/header'
import { Nav } from '@/features/docs/navbar/navbar'
/* import { Trigger } from "@/components/ai/search-ai"; */

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  sidebar: {
    collapsible: false,
    footer: false,
    hideSearch: true,
    banner: <DocsNavHeader />,
    tabs: false,
    components: {
      Separator: DocsNavSeparator,
      Item: DocsNavItem,
    },
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <div className="container mx-auto w-full max-w-[1200px]">
        <DocsLayout {...docsOptions}>{children}</DocsLayout>
      </div>
    </>
  )
}
