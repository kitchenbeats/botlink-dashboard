"use client";

import { DebouncedInput } from "@/components/ui/input";
import {
  ColumnFiltersState,
  ColumnSizingState,
  flexRender,
  PaginationState,
  SortingState,
  TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef, useCallback } from "react";
import {
  getSandboxMetricsAction,
  getTeamSandboxesAction,
} from "@/actions/sandboxes-actions";
import {
  DataTable,
  DataTableHead,
  DataTableCell,
  DataTableRow,
  DataTableHeader,
  DataTableBody,
} from "@/components/ui/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import { useApiUrl } from "@/hooks/use-api-url";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import { QUERY_KEYS } from "@/configs/query-keys";
import { Kbd } from "@/components/ui/kdb";
import SandboxesTableFilters, {
  StartedAtFilter,
} from "./sandboxes-table-filters";
import useIsMounted from "@/hooks/use-is-mounted";
import { cn } from "@/lib/utils";
import { fallbackData, sandboxesTableConfig } from "./sandboxes-table-config";
import React from "react";
import { subHours } from "date-fns";
import { Sandbox } from "@/types/api";
import { useSelectedTeam } from "@/hooks/use-teams";
import { Badge } from "@/components/ui/badge";
import { Circle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SandboxesTable() {
  "use no memo";

  const team = useSelectedTeam();
  const apiUrl = useApiUrl();
  const isMounted = useIsMounted();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting, removeSorting] = useSessionStorage<SortingState>(
    "sandboxes:sorting",
    [],
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const [globalFilter, setGlobalFilter, removeGlobalFilter] =
    useSessionStorage<string>("sandboxes:globalFilter", "");

  const [columnSizing, setColumnSizing, removeColumnSizing] =
    useLocalStorage<ColumnSizingState>(
      "sandboxes:columnSizing",
      {},
      {
        deserializer: (value) => JSON.parse(value),
        serializer: (value) => JSON.stringify(value),
      },
    );

  const [startedAtFilter, setStartedAtFilter, removeStartedAtFilter] =
    useSessionStorage<StartedAtFilter>("sandboxes:startedAtFilter", undefined);

  const [pagination, setPagination, removePagination] =
    useSessionStorage<PaginationState>("sandboxes:pagination", {
      pageIndex: 0,
      pageSize: 50,
    });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const [templateId, setTemplateId] = React.useState<string | undefined>();

  useEffect(() => {
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

  useEffect(() => {
    if (!templateId) {
      setColumnFilters((state) => state.filter((f) => f.id !== "template"));
      return;
    }

    setColumnFilters((state) => [
      ...state,
      { id: "template", value: templateId },
    ]);
  }, [templateId]);

  const {
    data: sandboxes,
    isLoading: sandboxesLoading,
    error: sandboxesError,
    mutate: refetchSandboxes,
  } = useSWR(
    team && apiUrl ? QUERY_KEYS.TEAM_SANDBOXES(team.id, apiUrl) : null,
    async () => {
      if (!team || !apiUrl) return;

      const res = await getTeamSandboxesAction({
        apiUrl,
        teamId: team.id,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
    {
      refreshInterval: 60 * 1000,
      refreshWhenHidden: false,
    },
  );

  const handleMetricsSuccess = useCallback(
    (data: Map<string, any>) => {
      if (!sandboxes) return;

      const newSandboxes = sandboxes?.map((sandbox) => ({
        ...sandbox,
        lastMetrics: data.get(sandbox.sandboxID),
      }));

      refetchSandboxes(newSandboxes, { revalidate: false });
    },
    [sandboxes, refetchSandboxes],
  );

  useSWR(
    team && apiUrl ? QUERY_KEYS.TEAM_SANDBOX_METRICS(team.id, apiUrl) : null,
    async () => {
      if (!team || !apiUrl || !sandboxes) return;

      const res = await getSandboxMetricsAction({
        apiUrl,
        teamId: team.id,
        sandboxes: sandboxes ?? [],
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
    {
      refreshInterval: 3 * 1000,
      onSuccess: (data) => {
        if (!data) return;

        handleMetricsSuccess(data);
      },
      refreshWhenHidden: false,
    },
  );

  const table = useReactTable({
    ...sandboxesTableConfig,
    data: sandboxes ?? fallbackData,
    state: {
      globalFilter,
      sorting,
      columnSizing,
      columnFilters,
      pagination,
      team,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
  } as TableOptions<Sandbox>);

  return (
    <div className="flex h-full flex-col gap-4 pt-3">
      {/* <TableTimelineFilter
      className="mx-3"
      date={date}
      onDateChange={setDate}
      /> */}

      <header className="mx-3 flex justify-between">
        <div className="flex w-full flex-col gap-4">
          <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            ref={searchInputRef}
          />
          <SandboxesTableFilters
            startedAtFilter={startedAtFilter}
            onStartedAtChange={setStartedAtFilter}
            clearStartedAt={removeStartedAtFilter}
            setTemplateId={setTemplateId}
            templateId={templateId}
          />
        </div>
        <div className="flex w-full flex-col items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="success"
              className="h-min w-fit gap-2 font-bold uppercase"
            >
              {sandboxes?.length} Sandboxes running
              <Circle className="size-2 fill-current" />
            </Badge>
            <Button
              variant="muted"
              className="h-min w-fit gap-2 rounded-sm px-2 py-1 font-bold uppercase"
              onClick={() => refetchSandboxes()}
              disabled={sandboxesLoading}
            >
              <RefreshCcw className="size-3.5" />
            </Button>
          </div>
          <Badge className="h-min w-fit gap-2 font-bold uppercase">
            {table.getFilteredRowModel().rows.length} / {sandboxes?.length}
          </Badge>
        </div>
      </header>

      {isMounted && (
        <DataTable className="h-full w-full overflow-auto pb-12">
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

          <DataTableBody>
            {sandboxesError ? (
              <DataTableRow>
                <Alert className="w-full text-left" variant="error">
                  <AlertTitle>Error loading sandboxes.</AlertTitle>
                  <AlertDescription>{sandboxesError.message}</AlertDescription>
                </Alert>
              </DataTableRow>
            ) : sandboxesLoading ? (
              <DataTableRow>
                <Alert className="w-full text-left" variant="contrast1">
                  <AlertTitle className="flex items-center gap-2">
                    <Loader variant="compute" />
                    Loading sandboxes...
                  </AlertTitle>
                  <AlertDescription>This may take a moment.</AlertDescription>
                </Alert>
              </DataTableRow>
            ) : sandboxes && table.getRowModel()?.rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    isSelected={row.getIsSelected()}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <DataTableCell key={cell.id} cell={cell}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </DataTableCell>
                    ))}
                  </DataTableRow>
                ))}
              </>
            ) : (
              <DataTableRow suppressHydrationWarning>
                <Alert
                  className="w-full text-left"
                  suppressHydrationWarning
                  variant="contrast2"
                >
                  <AlertTitle suppressHydrationWarning>
                    No sandboxes found.
                  </AlertTitle>
                  <AlertDescription suppressHydrationWarning>
                    Start more Sandboxes or try different filters.
                  </AlertDescription>
                </Alert>
              </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}

const SearchInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    className?: string;
  }
>(({ value, onChange, className }, ref) => {
  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "/") {
          e.preventDefault();
          if (ref && "current" in ref) {
            (ref as React.RefObject<HTMLInputElement>).current?.focus();
          }
          return true;
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [ref]);

  return (
    <div className={cn("relative w-full max-w-[420px]", className)}>
      <DebouncedInput
        value={value}
        onChange={(v) => onChange(v as string)}
        placeholder="Find a sandbox..."
        className="w-full pr-14"
        ref={ref}
        debounce={500}
      />
      <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
    </div>
  );
});

SearchInput.displayName = "SearchInput";
