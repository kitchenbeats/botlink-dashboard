"use client";

import { MoreVertical, Lock, LockOpen, Trash, Cpu } from "lucide-react";
import {
  ColumnDef,
  FilterFn,
  getSortedRowModel,
  getCoreRowModel,
  getFilteredRowModel,
  TableOptions,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Template } from "@/types/api";
import { useApiUrl } from "@/features/dashboard/developer-settings/stores/developer-settings-store";
import { useParams } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import { mutate } from "swr";
import { QUERY_KEYS } from "@/configs/query-keys";
import { Button } from "@/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import {
  deleteTemplateAction,
  updateTemplateAction,
} from "@/actions/templates-actions";
import { useMemo } from "react";
import { Badge } from "@/ui/primitives/badge";
import { CgSmartphoneRam } from "react-icons/cg";

// FILTERS
export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Skip undefined values
  if (!value || !value.length) return true;

  const searchValue = value.toLowerCase();
  const rowValue = row.getValue(columnId);

  // Handle null/undefined row values
  if (rowValue == null) return false;

  // Convert row value to string and lowercase for comparison
  const itemStr = String(rowValue).toLowerCase();
  const itemRank = rankItem(itemStr, searchValue);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

// TABLE CONFIG
export const fallbackData: Template[] = [];

export const useColumns = (deps: any[]) => {
  return useMemo<ColumnDef<Template>[]>(
    () => [
      {
        id: "actions",
        enableSorting: false,
        enableGlobalFilter: false,
        enableResizing: false,
        size: 35,
        cell: ({ row }) => {
          const template = row.original;
          const apiUrl = useApiUrl();
          const { teamId } = useParams();
          const { toast } = useToast();

          const togglePublish = async () => {
            try {
              const response = await updateTemplateAction({
                apiUrl,
                templateId: template.templateID,
                props: {
                  isPublic: !template.public,
                },
              });

              if (response.type === "error") {
                throw new Error(response.message);
              }

              await mutate(QUERY_KEYS.TEAM_TEMPLATES(teamId as string, apiUrl));
              toast({
                title: "Success",
                description: `Template ${template.public ? "unpublished" : "published"} successfully`,
              });
            } catch (error: any) {
              toast({
                title: "Failed to update template visibility",
                description: error.message,
                variant: "error",
              });
            }
          };

          const deleteTemplate = async () => {
            try {
              const response = await deleteTemplateAction({
                apiUrl,
                templateId: template.templateID,
              });

              if (response.type === "error") {
                throw new Error(response.message);
              }

              await mutate(QUERY_KEYS.TEAM_TEMPLATES(teamId as string, apiUrl));
              toast({
                title: "Success",
                description: "Template deleted successfully",
              });
            } catch (error: any) {
              toast({
                title: "Failed to delete template",
                description: error.message,
                variant: "error",
              });
            }
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-fg-500"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={togglePublish}>
                  {template.public ? (
                    <>
                      <Lock className="mr-2 size-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <LockOpen className="mr-2 size-4" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deleteTemplate}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      /*       {
        accessorKey: "aliases",
        header: "Aliases",
        cell: ({ row }) => (
          <div className="font-mono font-medium">
            {(row.getValue("aliases") as string[])[0]}
          </div>
        ),
      }, */
      {
        accessorKey: "templateID",
        header: "ID",
        size: 160,
        minSize: 120,
        cell: ({ row }) => (
          <div className="truncate font-mono text-xs text-fg-500">
            {row.getValue("templateID")}
          </div>
        ),
      },
      {
        accessorKey: "cpuCount",
        header: "CPU",
        size: 125,
        minSize: 125,
        cell: ({ row }) => {
          const cpuCount = row.getValue("cpuCount") as number;
          return (
            <Badge variant="contrast-2" className="whitespace-nowrap font-mono">
              <Cpu className="size-2" /> {cpuCount} core
              {cpuCount > 1 ? "s" : ""}
            </Badge>
          );
        },
        filterFn: "equals",
      },
      {
        accessorKey: "memoryMB",
        header: "Memory",
        size: 140,
        minSize: 140,
        cell: ({ row }) => {
          const memoryMB = row.getValue("memoryMB") as number;
          return (
            <Badge variant="contrast-1" className="whitespace-nowrap font-mono">
              <CgSmartphoneRam className="size-2" /> {memoryMB.toLocaleString()}{" "}
              MB
            </Badge>
          );
        },
        filterFn: "equals",
      },
      {
        accessorFn: (row) => new Date(row.createdAt).toUTCString(),
        enableGlobalFilter: true,
        header: "Created",
        size: 250,
        minSize: 140,
        cell: ({ getValue }) => (
          <div className="truncate font-mono text-xs text-fg-500">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorFn: (row) => new Date(row.updatedAt).toUTCString(),
        header: "Last Updated",
        size: 250,
        minSize: 140,
        enableGlobalFilter: true,
        cell: ({ getValue }) => (
          <div className="truncate font-mono text-xs text-fg-500">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "public",
        header: "Public",
        size: 100,
        minSize: 100,
        cell: ({ row }) => (
          <Badge
            variant={row.getValue("public") ? "success" : "muted"}
            className="ml-3 whitespace-nowrap font-mono"
          >
            {row.getValue("public") ? "true" : "false"}
          </Badge>
        ),
        enableSorting: false,
        filterFn: "equals",
      },
    ],
    deps,
  );
};

export const templatesTableConfig: Partial<TableOptions<Template>> = {
  filterFns: {
    fuzzy: fuzzyFilter,
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: true,
  enableMultiSort: true,
  columnResizeMode: "onChange",
  enableColumnResizing: true,
  enableGlobalFilter: true,
  // @ts-expect-error globalFilterFn is not a valid option
  globalFilterFn: "fuzzy",
};
