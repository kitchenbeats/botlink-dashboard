import { Badge } from "@/ui/primitives/badge";
import { Circle } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { SearchInput } from "./table-search";
import SandboxesTableFilters from "./table-filters";
import { SandboxWithMetrics } from "./table-config";
import { PollingButton } from "@/ui/polling-button";
import { useSandboxTableStore } from "./stores/table-store";

interface SandboxesHeaderProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sandboxes: SandboxWithMetrics[] | undefined;
  sandboxesLoading: boolean;
  refetchSandboxes: () => void;
  table: Table<SandboxWithMetrics>;
}

export function SandboxesHeader({
  searchInputRef,
  sandboxes,
  sandboxesLoading,
  refetchSandboxes,
  table,
}: SandboxesHeaderProps) {
  "use no memo";

  const { pollingInterval, setPollingInterval } = useSandboxTableStore();

  return (
    <header className="mx-3 flex justify-between">
      <div className="flex w-full flex-col gap-8">
        <SearchInput ref={searchInputRef} />
        <SandboxesTableFilters />
      </div>
      <div className="flex w-full flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <PollingButton
            pollingInterval={pollingInterval}
            onIntervalChange={setPollingInterval}
            onRefresh={() => refetchSandboxes()}
            isLoading={sandboxesLoading}
          />
          <Badge
            variant="success"
            className="h-min w-fit gap-2 font-bold uppercase"
          >
            {sandboxes?.length} Sandboxes running
            <Circle className="size-2 fill-current" />
          </Badge>
        </div>
        <Badge className="h-min w-fit gap-2 font-bold uppercase">
          {table.getFilteredRowModel().rows.length} / {sandboxes?.length}
        </Badge>
      </div>
    </header>
  );
}
