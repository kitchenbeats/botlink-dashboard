import * as React from "react";
import { cn } from "@/lib/utils";
import { Cell, Header } from "@tanstack/react-table";
import { Separator } from "@/ui/primitives/separator";
import { Button } from "@/ui/primitives/button";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/ui/primitives/select";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  header: Header<TData, TValue>;
  canSort?: boolean;
  sorting?: boolean;
}

function DataTableHead<TData, TValue>({
  header,
  children,
  className,
  sorting,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div
      className={cn(
        "relative flex h-10 items-center p-2 text-left align-middle",
        "font-mono uppercase tracking-wider",
        "font-medium text-fg-300",
        "[&:has([role=checkbox])]:pr-0",
        className,
      )}
      style={{
        width: `calc(var(--header-${header.id}-size) * 1)`,
      }}
      {...props}
    >
      <div className="flex h-full items-center gap-3">
        {header.column.getCanSort() && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => header.column.toggleSorting(undefined, true)}
            className={cn(
              "size-5 text-fg-500",
              sorting !== undefined && "text-accent",
            )}
          >
            {sorting === undefined ? (
              <ArrowUpDown className="size-3" />
            ) : sorting ? (
              <ArrowDownWideNarrow className="size-3" />
            ) : (
              <ArrowUpNarrowWide className="size-3" />
            )}
          </Button>
        )}
        <span>{children}</span>
      </div>

      {header.column.getCanResize() && (
        <div
          className="ml-auto h-full cursor-ew-resize px-2"
          onTouchStart={header.getResizeHandler()}
          onMouseDown={header.getResizeHandler()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Separator className="h-full" orientation="vertical" />
        </div>
      )}
    </div>
  );
}

interface DataTableCellProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  cell: Cell<TData, TValue>;
  children: React.ReactNode;
}

function DataTableCell<TData, TValue>({
  cell,
  children,
  className,
  ...props
}: DataTableCellProps<TData, TValue>) {
  return (
    <div
      style={{
        width: `calc(var(--col-${cell.column.id}-size) * 1)`,
      }}
      className={cn(
        "p-1 px-2 align-middle font-sans text-xs [&:has([role=checkbox])]:pr-0",
        "flex items-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  isSelected?: boolean;
}

const DataTableRow = React.forwardRef<HTMLDivElement, DataTableRowProps>(
  ({ children, className, isSelected, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg transition-colors data-[state=selected]:bg-bg-300 hover:bg-bg-100/80",
          "flex w-full items-center",
          {
            "bg-bg-100": isSelected,
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DataTableRow.displayName = "DataTableRow";

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base table styles from table.tsx
          "w-full caption-bottom border-t",
          "font-mono text-sm",
          // Div table styles
          "w-fit",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DataTable.displayName = "DataTable";

interface DataTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DataTableHeader({
  className,
  children,
  ...props
}: DataTableHeaderProps) {
  return (
    <div className={cn("border-b", className)} {...props}>
      {children}
    </div>
  );
}

interface DataTableBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  virtualizedTotalHeight?: number;
}

function DataTableBody({ className, children, ...props }: DataTableBodyProps) {
  return (
    <div
      style={
        props.virtualizedTotalHeight
          ? {
              height: `${props.virtualizedTotalHeight}px`,
              position: "relative",
            }
          : {}
      }
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface DataTablePaginationProps {
  className?: string;
  pageSize: number;
  pageIndex: number;
  pageCount: number;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (pageIndex: number) => void;
}

function DataTablePagination({
  className,
  pageSize,
  pageIndex,
  pageCount,
  onPageSizeChange,
  onPageChange,
}: DataTablePaginationProps) {
  return (
    <div className={cn("flex items-center gap-8 border-t p-2 px-3", className)}>
      <div className="flex items-center gap-2 text-xs">
        <div className="text-fg-300">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => onPageChange(0)}
            disabled={pageIndex === 0}
          >
            ««
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex === pageCount - 1}
          >
            »
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={pageIndex === pageCount - 1}
          >
            »»
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-fg-300">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-6 w-fit gap-1 border-none bg-transparent pr-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50, 75, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>rows per page</span>
      </div>
    </div>
  );
}

export {
  DataTableHead,
  DataTableCell,
  DataTableRow,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
};
