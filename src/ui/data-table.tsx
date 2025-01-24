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

function DataTableRow({
  children,
  className,
  isSelected,
  ...props
}: DataTableRowProps) {
  return (
    <div
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
}

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div
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
}

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
}

function DataTableBody({ className, children, ...props }: DataTableBodyProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
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
};
