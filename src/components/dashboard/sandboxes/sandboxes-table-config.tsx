"use client";

import { Circle, ChevronsUpDown, Pause, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Sandbox, Template } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PROTECTED_URLS } from "@/configs/urls";
import { useSelectedTeam } from "@/hooks/use-teams";

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
    accessorKey: "sandboxID",
    header: "SANDBOX ID",
    cell: ({ row }) => (
      <div className="truncate font-mono text-xs text-fg-500">
        {row.getValue("sandboxID")}
      </div>
    ),
    size: 160,
    minSize: 160,
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
          <Badge variant="accent" className="font-sans font-medium">
            {templateId}
            <ArrowUpRight className="size-3" />
          </Badge>
        </Link>
      );
    },
    size: 250,
    minSize: 180,
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
  },
  {
    id: "load",
    header: "Load",
    cell: ({ row, table }) => {
      // TODO: determine status state correctly
      const randRef = useRef<number>(Math.random());

      const load: "low" | "medium" | "high" =
        randRef.current < 0.1
          ? "high"
          : randRef.current < 0.5
            ? "medium"
            : "low";

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
  },
];
