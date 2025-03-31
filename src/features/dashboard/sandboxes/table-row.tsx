import { memo } from 'react'
import { Row } from '@tanstack/react-table'
import { DataTableCell, DataTableRow } from '@/ui/data-table'
import { flexRender } from '@tanstack/react-table'
import { Sandbox } from '@/types/api'

interface TableRowProps {
  row: Row<Sandbox>
}

export const TableRow = memo(function TableRow({ row }: TableRowProps) {
  return (
    <DataTableRow key={row.id} isSelected={row.getIsSelected()}>
      {row.getVisibleCells().map((cell) => (
        <DataTableCell key={cell.id} cell={cell}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </DataTableCell>
      ))}
    </DataTableRow>
  )
})
