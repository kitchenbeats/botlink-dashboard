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
    templateId,
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
    if (!startedAtFilter) {
      setColumnFilters((state) => state.filter((f) => f.id !== "startedAt"));
      return;
    }

    const now = new Date();
    const from =
      startedAtFilter === "1h ago"
        ? subHours(now, 1)
        : startedAtFilter === "6h ago"
          ? subHours(now, 6)
          : startedAtFilter === "12h ago"
            ? subHours(now, 12)
            : undefined;

    setColumnFilters((state) => [
      ...state,
      { id: "startedAt", value: { from, to: now } },
    ]);
  }, [startedAtFilter]);

  React.useEffect(() => {
    if (!templateId) {
      setColumnFilters((state) => state.filter((f) => f.id !== "template"));
      return;
    }

    setColumnFilters((state) => [
      ...state,
      { id: "template", value: templateId },
    ]);
  }, [templateId]);

  React.useEffect(() => {
    if (!cpuCount) {
      setColumnFilters((state) => state.filter((f) => f.id !== "cpuUsage"));
      return;
    }

    setColumnFilters((state) => [
      ...state.filter((f) => f.id !== "cpuUsage"),
      { id: "cpuUsage", value: cpuCount },
    ]);
  }, [cpuCount]);

  React.useEffect(() => {
    if (!memoryMB) {
      setColumnFilters((state) => state.filter((f) => f.id !== "ramUsage"));
      return;
    }

    setColumnFilters((state) => [
      ...state.filter((f) => f.id !== "ramUsage"),
      { id: "ramUsage", value: memoryMB },
    ]);
  }, [memoryMB]);

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

      {isMounted && (
        <DataTable
          className="h-full w-full overflow-auto pb-12"
          style={{ ...columnSizeVars, width: "100%" }}
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
  );
}
