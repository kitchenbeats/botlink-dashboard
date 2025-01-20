import * as React from "react";
import { cn } from "@/lib/utils";
import { Cell, Column, Header } from "@tanstack/react-table";
import { Separator } from "./separator";

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
        {
          "cursor-pointer": header.column.getCanSort(),
        },
        className,
      )}
      style={{
        width: `${header.column.getSize()}px`,
      }}
      onClick={
        header.column.getCanSort()
          ? () => header.column.toggleSorting()
          : undefined
      }
      {...props}
    >
      {header.column.getCanSort() ? (
        <div
          onClick={() => header.column.toggleSorting()}
          className="flex h-full items-center"
        >
          <span>{children}</span>
          {sorting !== undefined && (
            <span className="ml-2 text-accent">
              {sorting === true ? "↓" : "↑"}
            </span>
          )}
        </div>
      ) : (
        children
      )}

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
        width: `${cell.column.getSize()}px`,
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
