"use client";

import { ChevronsUpDown, ArrowUpRight, Cpu } from "lucide-react";
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
import { Sandbox, SandboxMetrics } from "@/types/api";
import { Badge, badgeVariants } from "@/components/ui/badge";
import Link from "next/link";
import { PROTECTED_URLS } from "@/configs/urls";
import { DateRange } from "react-day-picker";
import {
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  isWithinInterval,
} from "date-fns";
import { VariantProps } from "class-variance-authority";
import { CgSmartphoneRam } from "react-icons/cg";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type SandboxWithMetrics = Sandbox & { lastMetrics: SandboxMetrics };

// FILTERS

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

  return isWithinInterval(startedAtDate, {
    start: value.from,
    end: value.to,
  });
};

// TABLE CONFIG

export const fallbackData: SandboxWithMetrics[] = [];

export const COLUMNS: ColumnDef<SandboxWithMetrics>[] = [
  {
    id: "expand",
    cell: () => <ChevronsUpDown className="size-3.5 text-fg-500" />,
    size: 30,
    enableResizing: false,
    enableColumnFilter: false,
  },
  /*   {
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
  }, */
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
    enableSorting: false,
  },
  {
    accessorKey: "templateID",
    id: "template",
    header: "TEMPLATE",
    cell: ({ getValue, table }) => {
      // @ts-expect-error team is not a valid state
      const team = table.getState().team;
      const templateId = getValue() as string;

      if (!team) return null;

      return (
        <Link
          href={PROTECTED_URLS.TEMPLATES(team!.id)}
          className="flex items-center gap-1 font-mono hover:text-accent hover:underline"
        >
          {templateId}
          <ArrowUpRight className="size-3" />
        </Link>
      );
    },
    size: 250,
    minSize: 180,
    filterFn: "equalsString",
  },
  {
    id: "cpuUsage",
    accessorKey: "lastMetrics.cpuPct",
    header: "CPU Usage",
    cell: ({ getValue, row }) => {
      const cpu = getValue() as number;

      const getVariant = (
        value: number,
      ): VariantProps<typeof badgeVariants>["variant"] => {
        if (value >= 80) return "error";
        if (value >= 50) return "warning";
        return "success";
      };

      return (
        <Badge
          variant={getVariant(cpu)}
          className="whitespace-nowrap font-mono"
        >
          <Cpu className="size-2" /> {cpu?.toFixed(0)}% ·{" "}
          {row.original.cpuCount} core{row.original.cpuCount > 1 ? "s" : ""}
        </Badge>
      );
    },
    size: 170,
    minSize: 170,
    enableColumnFilter: false,
  },
  {
    id: "ramUsage",
    accessorFn: (row) => (row.lastMetrics.memMiBUsed / row.memoryMB) * 100,
    header: "RAM Usage",
    cell: ({ getValue, row }) => {
      const ramPercentage = getValue() as number;

      const totalRam = row.original.memoryMB;
      const usedRam = row.original.lastMetrics.memMiBUsed;

      const getVariant = (
        percentage: number,
      ): VariantProps<typeof badgeVariants>["variant"] => {
        if (percentage >= 80) return "error";
        if (percentage >= 50) return "warning";
        return "success";
      };

      return (
        <Badge
          variant={getVariant(ramPercentage)}
          className="whitespace-nowrap font-mono"
        >
          <CgSmartphoneRam className="size-2" /> {usedRam}/{totalRam} MB
        </Badge>
      );
    },
    size: 160,
    minSize: 160,
    enableColumnFilter: false,
  },
  {
    accessorKey: "startedAt",
    header: "Started At",
    cell: ({ row, table }) => {
      const [isHovered, setIsHovered] = useState(false);
      const startDate = new Date(row.getValue("startedAt"));
      const duration = `${differenceInHours(new Date(), startDate)}h ${
        differenceInMinutes(new Date(), startDate) % 60
      }m ${differenceInSeconds(new Date(), startDate) % 60}s`;

      return (
        <div
          className={cn(
            "h-full truncate font-mono text-xs text-fg-500 hover:text-fg",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {startDate.toUTCString()}
          <AnimatePresence mode="wait">
            {isHovered && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-end gap-1 overflow-hidden text-success-fg"
              >
                running for {duration}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    size: 250,
    minSize: 140,
    // @ts-expect-error dateRange is not a valid filterFn
    filterFn: "dateRange",
  },
];

export const sandboxesTableConfig: Partial<TableOptions<SandboxWithMetrics>> = {
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
  enableMultiSort: true,
  columnResizeMode: "onChange",
  enableColumnResizing: true,
};
