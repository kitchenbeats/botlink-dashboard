import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Circle, RefreshCcw } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { SearchInput } from "./table-search";
import SandboxesTableFilters from "./table-filters";
import { SandboxWithMetrics } from "./table-config";

interface TableHeaderProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sandboxes: SandboxWithMetrics[] | undefined;
  sandboxesLoading: boolean;
  refetchSandboxes: () => void;
  table: Table<SandboxWithMetrics>;
}

export function TableHeader({
  searchInputRef,
  sandboxes,
  sandboxesLoading,
  refetchSandboxes,
  table,
}: TableHeaderProps) {
  return (
    <header className="mx-3 flex justify-between">
      <div className="flex w-full flex-col gap-8">
        <SearchInput ref={searchInputRef} />
        <SandboxesTableFilters />
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
  );
}
