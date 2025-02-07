import { Table } from '@tanstack/react-table'
import { Template } from '@/types/api'
import { DataTableBody, DataTableRow, DataTableCell } from '@/ui/data-table'
import { flexRender } from '@tanstack/react-table'
import Empty from '@/ui/empty'
import { Button } from '@/ui/primitives/button'
import { useTemplateTableStore } from './stores/table-store'
import { useMemo } from 'react'

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

  if (isEmpty) {
    return (
      <Empty
        title="No Templates Found"
        description={
          <>
            Create a new template to get started or{' '}
            <Button
              variant="link"
              size="sm"
              className="normal-case"
              onClick={resetFilters}
            >
              reset
            </Button>
            your filters
          </>
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
