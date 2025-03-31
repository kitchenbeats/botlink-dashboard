import { DataTableBody } from '@/ui/data-table'
import { Table, Row } from '@tanstack/react-table'
import { memo, useMemo } from 'react'
import Empty from '@/ui/empty'
import { Button } from '@/ui/primitives/button'
import { useSandboxTableStore } from './stores/table-store'
import { ExternalLink, X } from 'lucide-react'
import { TableRow } from './table-row'
import { Sandbox } from '@/types/api'

interface TableBodyProps {
  sandboxes: Sandbox[] | undefined
  table: Table<Sandbox>
  visualRows: Row<Sandbox>[]
}

export const TableBody = memo(function TableBody({
  sandboxes,
  table,
  visualRows,
}: TableBodyProps) {
  const resetFilters = useSandboxTableStore((state) => state.resetFilters)

  const isEmpty = sandboxes && visualRows?.length === 0

  const hasFilter = useMemo(() => {
    return (
      Object.values(table.getState().columnFilters).some(
        (filter) => filter.value !== undefined
      ) || table.getState().globalFilter !== ''
    )
  }, [table])

  if (isEmpty) {
    if (hasFilter) {
      return (
        <Empty
          title="No Results Found"
          description="No sandboxes match your current filters"
          message={
            <Button variant="default" onClick={resetFilters}>
              Reset Filters <X className="text-accent size-4" />
            </Button>
          }
          className="h-[70%] max-md:w-screen"
        />
      )
    }

    return (
      <Empty
        title="No Sandboxes Yet"
        description="Running Sandboxes can be observed here"
        message={
          <Button variant="default" asChild>
            <a href="/docs/quickstart" target="_blank" rel="noopener">
              Create a Sandbox
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        }
        className="h-[70%] max-md:w-screen"
      />
    )
  }

  return (
    <DataTableBody>
      {visualRows.map((row) => (
        <TableRow key={row.id} row={row} />
      ))}
    </DataTableBody>
  )
})
