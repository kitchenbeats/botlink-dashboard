"use client";

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { rankItem } from "@tanstack/match-sorter-utils";
import { Template } from "@/types/api";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useParams } from "next/navigation";
import {
  DataTableHead,
  DataTableCell,
  DataTableRow,
  DataTableHeader,
  DataTableBody,
} from "@/ui/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { Loader } from "@/ui/loader";
import { useApiUrl } from "@/features/dashboard/developer-settings/stores/developer-settings-store";
import { Button } from "@/ui/primitives/button";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { MoreVertical, Lock, LockOpen, Trash } from "lucide-react";
import {
  deleteTemplateAction,
  updateTemplateAction,
} from "@/actions/templates-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { mutate } from "swr";
import { useRef, useEffect } from "react";
import { ColumnSizingState } from "@tanstack/react-table";
import { DataTable } from "@/ui/data-table";
import { DebouncedInput } from "@/ui/primitives/input";
import { Kbd } from "@/ui/primitives/kbd";
import useIsMounted from "@/lib/hooks/use-is-mounted";
import { useTemplates } from "@/lib/hooks/use-templates";

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

// stable reference for fallback data
const fallbackData: Template[] = [];

export default function TemplatesTable() {
  "use no memo";

  const isMounted = useIsMounted();

  const [sorting, setSorting, removeSorting] = useSessionStorage<SortingState>(
    "templates:sorting",
    [],
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const [globalFilter, setGlobalFilter, removeGlobalFilter] =
    useSessionStorage<string>("templates:globalFilter", "");

  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    "templates:columnSizing",
    {},
    {
      deserializer: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates();

  const table = useReactTable({
    data: templates ?? fallbackData,
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
                      sorting={sorting.find((s) => s.id === header.id)?.desc}
                    >
                      {header.isPlaceholder
                        ? ""
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
              {templatesError ? (
                <DataTableRow>
                  <Alert className="w-full text-left" variant="error">
                    <AlertTitle>Error loading templates.</AlertTitle>
                    <AlertDescription>
                      {templatesError.message}
                    </AlertDescription>
                  </Alert>
                </DataTableRow>
              ) : templatesLoading ? (
                <DataTableRow>
                  <Alert className="w-full text-left" variant="contrast1">
                    <AlertTitle className="flex items-center gap-2">
                      <Loader variant="compute" />
                      Loading templates...
                    </AlertTitle>
                    <AlertDescription>This may take a moment.</AlertDescription>
                  </Alert>
                </DataTableRow>
              ) : templates && table.getRowModel()?.rows?.length ? (
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
                /* we suppress hydration warning here because the table is not hydrated correctly until the query is enabled on mount */
                <DataTableRow suppressHydrationWarning>
                  <Alert
                    className="w-full text-left"
                    suppressHydrationWarning
                    variant="contrast2"
                  >
                    <AlertTitle suppressHydrationWarning>
                      No templates found.
                    </AlertTitle>
                    <AlertDescription suppressHydrationWarning>
                      Start more Templates or try different filters.
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

const COLUMNS: ColumnDef<Template>[] = [
  {
    accessorKey: "aliases",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-mono font-medium">
        {(row.getValue("aliases") as string[])[0]}
      </div>
    ),
  },
  {
    accessorKey: "templateID",
    header: "ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-fg-500">
        {row.getValue("templateID")}
      </div>
    ),
  },
  {
    accessorKey: "cpuCount",
    header: "CPU",
    cell: ({ row }) => (
      <div className="font-mono">{row.getValue("cpuCount")}x vCPU</div>
    ),
  },
  {
    accessorKey: "memoryMB",
    header: "Memory",
    cell: ({ row }) => (
      <div className="font-mono">
        {(row.getValue("memoryMB") as number) / 1024}GB RAM
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div className="font-mono text-xs">
        {formatDistanceToNow(new Date(row.getValue("createdAt")), {
          addSuffix: true,
        })}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => (
      <div className="font-mono text-xs">
        {formatDistanceToNow(new Date(row.getValue("updatedAt")), {
          addSuffix: true,
        })}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
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
            <Button variant="ghost" size="sm">
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
];

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
