"use client";

import { ChevronsUpDown, ArrowUpRight } from "lucide-react";
import {
  ColumnDef,
  FilterFn,
  getSortedRowModel,
  getCoreRowModel,
  getFilteredRowModel,
  TableOptions,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Sandbox } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PROTECTED_URLS } from "@/configs/urls";
import { useSelectedTeam } from "@/hooks/use-teams";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";

// FILTERS

declare module "@tanstack/table-core" {
  interface FilterFns {
    dateRange: FilterFn<Sandbox>;
    fuzzy: FilterFn<Sandbox>;
  }
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

export const dateRangeFilter: FilterFn<Sandbox> = (
  row,
  columnId,
  value: DateRange,
  addMeta,
) => {
  const startedAt = row.getValue(columnId) as string;

  if (!startedAt) return false;

  const startedAtDate = new Date(startedAt);

  if (!value.from || !value.to) return true;

  console.log(startedAtDate, value.from, value.to);

  return isWithinInterval(startedAtDate, {
    start: value.from,
    end: value.to,
  });
};

// TABLE CONFIG

export const fallbackData: Sandbox[] = [];

export const COLUMNS: ColumnDef<Sandbox>[] = [
  {
    id: "expand",
    cell: () => <ChevronsUpDown className="size-3.5 text-fg-500" />,
    size: 30,
    enableResizing: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "sandboxID",
    header: "SANDBOX ID",
    cell: ({ row }) => (
      <div className="truncate font-mono text-xs text-fg-500">
        {row.getValue("sandboxID")}
      </div>
    ),
    size: 160,
    minSize: 160,
    enableColumnFilter: false,
  },
  {
    accessorKey: "templateID",
    id: "template",
    header: "TEMPLATE",
    cell: ({ getValue }) => {
      const team = useSelectedTeam();
      const templateId = getValue() as string;

      if (!team) return null;

      return (
        <Link href={PROTECTED_URLS.TEMPLATES(team!.id)}>
          <Badge variant="accent" className="font-sans font-normal">
            {templateId}
            <ArrowUpRight className="size-3" />
          </Badge>
        </Link>
      );
    },
    size: 250,
    minSize: 180,
    filterFn: "equalsString",
  },
  {
    accessorKey: "alias",
    header: "Alias",
    cell: ({ getValue }) => (
      <div className="truncate text-start font-mono font-medium">
        {getValue() as string}
      </div>
    ),
    size: 220,
    minSize: 180,
    enableColumnFilter: false,
  },
  {
    id: "load",
    header: "Load",
    accessorFn: (row) => Math.random(),
    cell: ({ row, getValue }) => {
      // TODO: find out how to retrieve load status
      const rng = getValue() as number;

      const load: "low" | "medium" | "high" =
        rng < 0.1 ? "high" : rng < 0.5 ? "medium" : "low";

      const badgeVariant =
        load === "low" ? "success" : load === "medium" ? "warning" : "error";

      const loadIcon = load === "low" ? "_" : load === "medium" ? "~" : "^";

      return (
        <Badge variant={badgeVariant} className="uppercase">
          {loadIcon} {load}
        </Badge>
      );
    },
    size: 120,
    minSize: 120,
    enableColumnFilter: false,
  },
  {
    accessorKey: "startedAt",
    header: "Started At",
    cell: ({ row }) => (
      <div className="truncate font-mono text-xs text-fg-500">
        {new Date(row.getValue("startedAt")).toUTCString()}
      </div>
    ),
    size: 250,
    minSize: 140,
    filterFn: "dateRange",
  },
];

export const sandboxesTableConfig: Partial<TableOptions<Sandbox>> = {
  columns: COLUMNS,
  filterFns: {
    fuzzy: fuzzyFilter,
    dateRange: dateRangeFilter,
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  enableSorting: true,
  columnResizeMode: "onChange",
  enableColumnResizing: true,
};
