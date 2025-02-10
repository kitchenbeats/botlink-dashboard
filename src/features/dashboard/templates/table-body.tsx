import { Table } from '@tanstack/react-table'
import { Template } from '@/types/api'
import { DataTableBody, DataTableRow, DataTableCell } from '@/ui/data-table'
import { flexRender } from '@tanstack/react-table'
import Empty from '@/ui/empty'
import { Button } from '@/ui/primitives/button'
import { useTemplateTableStore } from './stores/table-store'
import { useMemo } from 'react'
import { ExternalLink, X } from 'lucide-react'
import ExternalIcon from '@/ui/external-icon'

interface TableBodyProps {
  templates: Template[] | undefined
  table: Table<Template>
  visualRowsCount: number
}

export function TableBody({
  templates,
  table,
  visualRowsCount,
}: TableBodyProps) {
  'use no memo'

  const resetFilters = useTemplateTableStore((state) => state.resetFilters)

  const centerRows = table.getCenterRows()

  const visualRows = useMemo(() => {
    return centerRows.slice(0, visualRowsCount)
  }, [centerRows, visualRowsCount])

  const isEmpty = templates && visualRows?.length === 0

  const hasFilter =
    Object.values(table.getState().columnFilters).some(
      (filter) => filter.value !== undefined
    ) || table.getState().globalFilter !== ''

  if (isEmpty) {
    if (hasFilter) {
      return (
        <Empty
          title="No Results Found"
          description={
            <div className="space-y-4">
              <p>No templates match your current filters.</p>
              <Button variant="default" onClick={resetFilters}>
                Reset Filters <X className="size-4 text-accent" />
              </Button>
            </div>
          }
          className="h-[70%] max-md:w-screen"
        />
      )
    }

    return (
      <Empty
        title="No Templates Yet"
        description={
          <div className="space-y-4">
            <p>Your Templates can be managed here.</p>
            <Button variant="default" asChild>
              <a href="/docs/sandbox-template" target="_blank" rel="noopener">
                Create a Template
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        }
        className="h-[70%] max-md:w-screen"
      />
    )
  }

  return (
    <DataTableBody>
      {visualRows.map((row) => (
        <DataTableRow
          key={row.id}
          isSelected={row.getIsSelected()}
          className="cursor-pointer"
        >
          {row.getVisibleCells().map((cell) => (
            <DataTableCell key={cell.id} cell={cell}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </DataTableCell>
          ))}
        </DataTableRow>
      ))}
    </DataTableBody>
  )
}
