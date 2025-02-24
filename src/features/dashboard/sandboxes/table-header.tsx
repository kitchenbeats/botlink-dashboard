import { cn } from '@/lib/utils'
import {
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/ui/data-table'
import { flexRender, HeaderGroup, Row, TableState } from '@tanstack/react-table'
import { SandboxWithMetrics } from './table-config'

interface TableHeaderProps {
  topRows: Row<SandboxWithMetrics>[]
  headerGroups: HeaderGroup<SandboxWithMetrics>[]
  state: TableState
}

const TableHeader = ({ topRows, headerGroups, state }: TableHeaderProps) => (
  <DataTableHeader
    className={cn('sticky top-0 shadow-sm', topRows?.length > 0 && 'mb-3')}
  >
    {headerGroups.map((headerGroup) => (
      <DataTableRow key={headerGroup.id} className="hover:bg-bg">
        {headerGroup.headers.map((header) => (
          <DataTableHead
            key={header.id}
            header={header}
            style={{
              width: header.getSize(),
            }}
            sorting={state.sorting.find((s) => s.id === header.id)?.desc}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </DataTableHead>
        ))}
      </DataTableRow>
    ))}
    {topRows?.length > 0 &&
      topRows?.map((row, index: number) => (
        <DataTableRow
          key={row.id}
          className={cn('bg-bg-100 hover:bg-bg-100', index === 0 && 'border-t')}
        >
          {row.getVisibleCells().map((cell) => (
            <DataTableCell cell={cell} key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </DataTableCell>
          ))}
        </DataTableRow>
      ))}
  </DataTableHeader>
)

export default TableHeader
