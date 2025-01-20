"use client";

import { DebouncedInput } from "@/components/ui/input";
import {
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import { getTeamSandboxesAction } from "@/actions/sandboxes-actions";
import { useParams } from "next/navigation";
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
import SandboxesTableFilters from "./sandboxes-table-filters";
import useIsMounted from "@/hooks/use-is-mounted";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { COLUMNS, fallbackData, fuzzyFilter } from "./sandboxes-table-config";

export default function SandboxesTable() {
  "use no memo";

  const { teamId } = useParams();
  const apiUrl = useApiUrl();
  const isMounted = useIsMounted();

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

  const [date, setDate, removeDate] = useSessionStorage<DateRange | undefined>(
    "sandboxes:date",
    {
      from: subDays(new Date(), 1),
      to: new Date(),
    },
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const [columnSizing, setColumnSizing, removeColumnSizing] =
    useLocalStorage<ColumnSizingState>(
      "sandboxes:columnSizing",
      {},
      {
        deserializer: (value) => JSON.parse(value),
        serializer: (value) => JSON.stringify(value),
      },
    );

  const {
    data: sandboxes,
    isLoading: sandboxesLoading,
    error: sandboxesError,
  } = useSWR(
    teamId && apiUrl
      ? QUERY_KEYS.TEAM_SANDBOXES(teamId as string, apiUrl)
      : null,
    async () => {
      const res = await getTeamSandboxesAction({
        apiUrl,
        teamId: teamId as string,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
  );

  const table = useReactTable({
    data: sandboxes ?? fallbackData,
    columns: COLUMNS,
    state: {
      globalFilter,
      sorting,
      columnSizing,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  return (
    <div className="flex h-full flex-col gap-4 pt-3">
      {/*       <TableTimelineFilter
        className="mx-3"
        date={date}
        onDateChange={setDate}
      /> */}

      <SearchInput
        value={globalFilter}
        onChange={setGlobalFilter}
        className="mx-3"
      />

      <SandboxesTableFilters className="mx-3" />

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
                    <div
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`resizer ${
                        header.column.getIsResizing() ? "isResizing" : ""
                      }`}
                    />
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
                  <DataTableRow key={row.id} isSelected={row.getIsSelected()}>
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

function SearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "/") {
          e.preventDefault();
          searchInputRef.current?.focus();

          return true;
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, []);

  return (
    <div className={cn("relative w-full max-w-[420px]", className)}>
      <DebouncedInput
        value={value}
        onChange={(v) => onChange(v as string)}
        placeholder="Find a sandbox..."
        className="w-full pr-14"
        ref={searchInputRef}
      />
      <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
    </div>
  );
}
