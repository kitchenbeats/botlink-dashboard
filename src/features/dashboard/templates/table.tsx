"use client";

import {
  ColumnFiltersState,
  flexRender,
  TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { Template } from "@/types/api";
import { DataTableHead, DataTableRow, DataTableHeader } from "@/ui/data-table";
import { useEffect, useRef, useState } from "react";
import { ColumnSizingState } from "@tanstack/react-table";
import { DataTable } from "@/ui/data-table";
import useIsMounted from "@/lib/hooks/use-is-mounted";
import { useTemplates } from "@/lib/hooks/use-templates";
import { fallbackData, templatesTableConfig, useColumns } from "./table-config";
import { useTemplateTableStore } from "./stores/table-store";
import { useLocalStorage } from "usehooks-ts";
import { useColumnSizeVars } from "@/lib/hooks/use-column-size-vars";
import { TableBody } from "./table-body";
import TemplatesHeader from "./header";

export default function TemplatesTable() {
  "use no memo";

  const isMounted = useIsMounted();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { sorting, setSorting, globalFilter, setGlobalFilter } =
    useTemplateTableStore();

  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    "templates:columnSizing",
    {},
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates();

  const { cpuCount, memoryMB, isPublic } = useTemplateTableStore();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Effect hooks for filters
  useEffect(() => {
    let newFilters = [...columnFilters];

    // Handle CPU filter
    if (!cpuCount) {
      newFilters = newFilters.filter((f) => f.id !== "cpuCount");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "cpuCount");
      newFilters.push({ id: "cpuCount", value: cpuCount });
    }

    // Handle memory filter
    if (!memoryMB) {
      newFilters = newFilters.filter((f) => f.id !== "memoryMB");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "memoryMB");
      newFilters.push({ id: "memoryMB", value: memoryMB });
    }

    // Handle public filter
    if (isPublic === undefined) {
      newFilters = newFilters.filter((f) => f.id !== "public");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "public");
      newFilters.push({ id: "public", value: isPublic });
    }

    setColumnFilters(newFilters);
  }, [cpuCount, memoryMB, isPublic]);

  const columns = useColumns([]);

  const table = useReactTable<Template>({
    ...templatesTableConfig,
    data: templates ?? fallbackData,
    columns: columns ?? fallbackData,
    state: {
      globalFilter,
      sorting,
      columnSizing,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnFiltersChange: setColumnFilters,
  } as TableOptions<Template>);

  const columnSizeVars = useColumnSizeVars(table);

  return (
    <div className="flex h-full flex-col pt-3">
      <TemplatesHeader searchInputRef={searchInputRef} />

      <div className="mt-4 max-w-[calc(100svw-var(--protected-sidebar-width))] flex-1 overflow-x-auto bg-bg">
        {isMounted && (
          <DataTable
            className="h-full min-w-[calc(100svw-var(--protected-sidebar-width))] overflow-y-auto"
            style={{ ...columnSizeVars }}
          >
            <DataTableHeader className="sticky top-0 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <DataTableRow key={headerGroup.id} className="hover:bg-bg">
                  {headerGroup.headers.map((header) => (
                    <DataTableHead
                      key={header.id}
                      header={header}
                      style={{
                        width: header.getSize(),
                      }}
                      sorting={sorting.find((s) => s.id === header.id)?.desc}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </DataTableHead>
                  ))}
                </DataTableRow>
              ))}
            </DataTableHeader>
            <TableBody
              templatesError={templatesError}
              templatesLoading={templatesLoading}
              templates={templates}
              table={table}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
}
