"use client";

import { Circle, ChevronsUpDown, Pause } from "lucide-react";
import { useRef } from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Sandbox } from "@/types/api";
import { Badge } from "@/components/ui/badge";

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

// stable reference for fallback data
export const fallbackData: Sandbox[] = [];

export const COLUMNS: ColumnDef<Sandbox>[] = [
  {
    id: "expand",
    cell: () => <ChevronsUpDown className="size-3.5 text-fg-500" />,
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
        <>
          <Badge variant={badgeVariant} className="uppercase">
            {statusIcon}
            {status}
          </Badge>
        </>
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
