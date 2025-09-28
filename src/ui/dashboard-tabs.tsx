'use client'

import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/primitives/tabs'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ReactElement, ReactNode, useMemo } from 'react'

type DashboardTabElement = ReactElement<DashboardTabProps, typeof DashboardTab>

export interface DashboardTabsProps {
  layoutKey: string
  type: 'query' | 'path'
  children: Array<DashboardTabElement> | DashboardTabElement
  className?: string
}

// COMPONENT

export function DashboardTabs({
  layoutKey,
  type,
  children,
  className,
}: DashboardTabsProps) {
  // ensure children is an array
  const tabChildren = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  )

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const tabsClassName = cn('min-h-0 w-full flex-1 h-full', className)
  const tabsListClassName = cn('bg-bg z-30 w-full justify-start pl-3 md:pl-6')
  const tabsTriggerClassName = cn('w-fit flex-none')

  // QUERY BASED TABS

  if (type === 'query') {
    // for query-based tabs, use current pathname as base
    const basePath = pathname

    const tabs = tabChildren.map((child) => ({
      id: child.props.id,
      label: child.props.label,
      icon: child.props.icon,
      href: `${basePath}?tab=${child.props.id}`,
    }))

    const defaultTab = tabs[0]!
    const activeTabId = searchParams.get('tab') || defaultTab?.id

    return (
      <Tabs value={activeTabId} className={tabsClassName}>
        <TabsList className={tabsListClassName}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              layoutkey={layoutKey}
              value={tab.id}
              className={tabsTriggerClassName}
              asChild
            >
              <Link href={tab.href} prefetch>
                {tab.icon}
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        {children}
      </Tabs>
    )
  }

  // PATH BASED TABS

  const tabs = tabChildren.map((child) => ({
    id: child.props.id,
    label: child.props.label,
    icon: child.props.icon,
  }))

  const basePath = inferBasePathForPathTabs(pathname, tabs)

  const tabsWithHrefs = tabs.map((tab) => ({
    ...tab,
    href: `${basePath}/${tab.id}`,
  }))

  const activeTabId =
    tabs.find((tab) => pathname.endsWith(tab.id))?.id || tabs[0]?.id

  return (
    <Tabs value={activeTabId} className={tabsClassName}>
      <TabsList className={tabsListClassName}>
        {tabsWithHrefs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            layoutkey={layoutKey}
            value={tab.id}
            className={tabsTriggerClassName}
            asChild
          >
            <Link href={tab.href} prefetch>
              {tab.icon}
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  )
}

export interface DashboardTabProps {
  id: string
  label: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardTab(props: DashboardTabProps) {
  return (
    <TabsContent
      value={props.id}
      className={cn(
        'flex-1 min-h-0 h-full w-full overflow-hidden',
        props.className
      )}
    >
      {props.children}
    </TabsContent>
  )
}

// HELPERS

/**
 * Infers the base path for path-based tabs by checking if the current
 * pathname ends with a tab ID. If it does, removes that segment to get the base.
 */
function inferBasePathForPathTabs(
  pathname: string,
  tabs: Array<{ id: string }>
): string {
  const pathSegments = pathname.split('/')
  const lastSegment = pathSegments[pathSegments.length - 1]

  // if last segment is a tab id, remove it to get base path
  const isTabSegment = tabs.some((tab) => tab.id === lastSegment)

  return isTabSegment ? pathSegments.slice(0, -1).join('/') : pathname
}
