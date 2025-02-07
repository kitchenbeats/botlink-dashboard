import { Badge } from '@/ui/primitives/badge'
import { Circle } from 'lucide-react'
import { Table } from '@tanstack/react-table'
import { SearchInput } from './table-search'
import SandboxesTableFilters from './table-filters'
import { SandboxWithMetrics } from './table-config'
import { PollingButton } from '@/ui/polling-button'
import { useSandboxTableStore } from './stores/table-store'
import { Template } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface SandboxesHeaderProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>
  templates: Template[]
  table: Table<SandboxWithMetrics>
  isPolling: boolean
}

export function SandboxesHeader({
  searchInputRef,
  templates,
  table,
  isPolling,
}: SandboxesHeaderProps) {
  'use no memo'

  const { pollingInterval, setPollingInterval } = useSandboxTableStore()
  const [isRefreshing, startRefreshTransition] = useTransition()

  const router = useRouter()

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  return (
    <header className="mx-3 flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <Badge
              variant="success"
              className="h-min w-fit gap-2 font-bold uppercase"
            >
              {table.getRowCount()} Sandboxes running
              <Circle className="size-2 fill-current" />
            </Badge>
            <Badge className="h-min w-fit gap-2 font-bold uppercase">
              {table.getFilteredRowModel().rows.length} / {table.getRowCount()}
            </Badge>
          </div>
          <SearchInput ref={searchInputRef} className="max-w-[380px]" />
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="hidden items-center gap-2 lg:flex">
            <PollingButton
              pollingInterval={pollingInterval}
              onIntervalChange={setPollingInterval}
              onRefresh={handleRefresh}
              isPolling={isPolling || isRefreshing}
            />
            <Badge
              variant="success"
              className="h-min w-fit gap-2 font-bold uppercase"
            >
              {table.getRowCount()} Sandboxes running
              <Circle className="size-2 fill-current" />
            </Badge>
          </div>
          <div className="flex w-full items-center justify-between gap-2 lg:hidden">
            <PollingButton
              pollingInterval={pollingInterval}
              onIntervalChange={setPollingInterval}
              onRefresh={handleRefresh}
              isPolling={isPolling || isRefreshing}
            />
          </div>
          <Badge className="hidden h-min w-fit gap-2 font-bold uppercase lg:block">
            {table.getFilteredRowModel().rows.length} / {table.getRowCount()}
          </Badge>
        </div>
      </div>
      <SandboxesTableFilters templates={templates} />
    </header>
  )
}
