"use client";

import { DebouncedInput } from "@/components/ui/input";
import {
  ColumnDef,
  ColumnSizingState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Sandbox } from "@/types/api";
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
import { ChevronsUpDown, Circle, Pause } from "lucide-react";
import useSWR from "swr";
import { QUERY_KEYS } from "@/configs/query-keys";
import { Kbd } from "@/components/ui/kdb";
import SandboxesTableFilters from "./sandboxes-table-filters";
import { Badge } from "@/components/ui/badge";

import "@/styles/div-table.css";
import useIsMounted from "@/hooks/use-is-mounted";

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

// stable reference for fallback data
const fallbackData: Sandbox[] = [];

const COLUMNS: ColumnDef<Sandbox>[] = [
  {
    id: "expand",
    cell: ({ row }) => <ChevronsUpDown className="size-3.5 text-fg-500" />,
    size: 30,
    enableResizing: false,
  },
  {
    accessorKey: "alias",
    header: "Name",
    cell: ({ row }) => (
      <div className="truncate text-start font-mono font-medium">
        {row.getValue("alias")}
      </div>
    ),
    size: 250,
    minSize: 180,
  },
  {
    accessorKey: "sandboxID",
    header: "ID",
    cell: ({ row }) => (
      <div className="truncate font-mono text-xs text-fg-500">
        {row.getValue("sandboxID")}
      </div>
    ),
    size: 100,
    minSize: 100,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row, table }) => {
      // TODO: determine status state correctly
      const randRef = useRef<number>(Math.random());

      const status: "running" | "paused" | "stopped" =
        randRef.current > 0.5 ? "running" : "paused";

      const badgeVariant =
        status === "running"
          ? "success"
          : status === "paused"
            ? "warning"
            : "default";

      const statusIcon =
        status === "running" ? (
          <Circle className="size-2 fill-current" />
        ) : status === "paused" ? (
          <Pause className="size-2" />
        ) : (
          "_"
        );

      return (
        <Badge variant={badgeVariant} className="uppercase">
          {statusIcon}
          {status}
        </Badge>
      );
    },
    size: 120,
    minSize: 120,
  },
  {
    accessorKey: "startedAt",
    header: "Started At",
    cell: ({ row }) => (
      <div className="truncate font-mono text-xs text-fg-500">
        {new Date(row.getValue("startedAt")).toISOString()}
      </div>
    ),
    size: 250,
    minSize: 140,
  },
];

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
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between gap-3 p-3">
        <SearchInput value={globalFilter} onChange={setGlobalFilter} />
      </div>

      <SandboxesTableFilters className="mx-4 mb-4 mt-auto" />

      {isMounted && (
        <div className="relative h-[60%]">
          <DataTable className="h-full w-full overflow-auto">
            <DataTableHeader className="sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <DataTableRow key={headerGroup.id}>
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
                    <AlertDescription>
                      {sandboxesError.message}
                    </AlertDescription>
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
                table.getRowModel().rows.map((row) => (
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
                ))
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
        </div>
      )}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
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
    <div className="relative w-full max-w-[420px]">
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
