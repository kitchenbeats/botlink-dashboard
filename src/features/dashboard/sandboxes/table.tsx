"use client";

import { useRef, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  ColumnFiltersState,
  ColumnSizingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
} from "@/ui/data-table";
import useIsMounted from "@/lib/hooks/use-is-mounted";
import {
  fallbackData,
  sandboxesTableConfig,
  SandboxWithMetrics,
} from "./table-config";
import React from "react";
import { useSandboxTableStore } from "@/features/dashboard/sandboxes/stores/table-store";
import { TableHeader } from "./table-header";
import { TableBody } from "./table-body";
import { flexRender } from "@tanstack/react-table";
import { subHours } from "date-fns";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { useSandboxData } from "./hooks/use-sandboxes-data";

export default function SandboxesTable() {
  const isMounted = useIsMounted();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const team = useSelectedTeam();

  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    "sandboxes:columnSizing",
    {},
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const {
    startedAtFilter,
    templateIds,
    cpuCount,
    memoryMB,
    sorting,
    globalFilter,
    pagination,
    setSorting,
    setGlobalFilter,
    setPagination,
  } = useSandboxTableStore();

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  // Effect hooks for filters
  React.useEffect(() => {
    let newFilters = [...columnFilters];

    // Handle startedAt filter
    if (!startedAtFilter) {
      newFilters = newFilters.filter((f) => f.id !== "startedAt");
    } else {
      const now = new Date();
      const from =
        startedAtFilter === "1h ago"
          ? subHours(now, 1)
          : startedAtFilter === "6h ago"
            ? subHours(now, 6)
            : startedAtFilter === "12h ago"
              ? subHours(now, 12)
              : undefined;

      newFilters = newFilters.filter((f) => f.id !== "startedAt");
      newFilters.push({ id: "startedAt", value: { from, to: now } });
    }

    // Handle template filter
    if (templateIds.length === 0) {
      newFilters = newFilters.filter((f) => f.id !== "template");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "template");
      newFilters.push({ id: "template", value: templateIds });
    }

    // Handle CPU filter
    if (!cpuCount) {
      newFilters = newFilters.filter((f) => f.id !== "cpuUsage");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "cpuUsage");
      newFilters.push({ id: "cpuUsage", value: cpuCount });
    }

    // Handle memory filter
    if (!memoryMB) {
      newFilters = newFilters.filter((f) => f.id !== "ramUsage");
    } else {
      newFilters = newFilters.filter((f) => f.id !== "ramUsage");
      newFilters.push({ id: "ramUsage", value: memoryMB });
    }

    setColumnFilters(newFilters);
  }, [startedAtFilter, templateIds, cpuCount, memoryMB]);

  const {
    sandboxes,
    sandboxesLoading,
    sandboxesError,
    sandboxesValidating,
    refetchSandboxes,
  } = useSandboxData();

  const table = useReactTable<SandboxWithMetrics>({
    ...sandboxesTableConfig,
    data: sandboxes ?? fallbackData,
    state: {
      globalFilter,
      sorting,
      columnSizing,
      columnFilters,
      pagination,
      // @ts-expect-error team is not a valid state
      team,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
  });

  /**
   * Use a memo to gather all column sizes once.
   * We'll store them in a simple object of CSS variables.
   */
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: string } = {};

    headers.forEach((header) => {
      const sizePx = `${header.getSize()}px`;
      colSizes[`--header-${header.id}-size`] = sizePx;
      colSizes[`--col-${header.column.id}-size`] = sizePx;
    });

    return colSizes;
  }, [table.getState().columnSizing, table.getState().columnSizingInfo]);

  return (
    <div className="flex h-full flex-col gap-4 pt-3">
      <TableHeader
        searchInputRef={searchInputRef}
        sandboxes={sandboxes}
        sandboxesLoading={sandboxesLoading || sandboxesValidating}
        refetchSandboxes={refetchSandboxes}
        table={table}
      />

      <div className="max-w-[calc(100svw-var(--protected-sidebar-width))] flex-1 overflow-x-auto bg-bg">
        {isMounted && (
          <DataTable
            className="h-full min-w-[calc(100svw-var(--protected-sidebar-width))] overflow-y-auto pb-12"
            style={{ ...columnSizeVars }}
          >
            <DataTableHeader className="sticky top-0">
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
              sandboxesError={sandboxesError}
              sandboxesLoading={sandboxesLoading}
              sandboxes={sandboxes}
              table={table}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
}
