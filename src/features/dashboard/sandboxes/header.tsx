import { Badge } from "@/ui/primitives/badge";
import { Circle } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { SearchInput } from "./table-search";
import SandboxesTableFilters from "./table-filters";
import { SandboxWithMetrics } from "./table-config";
import { PollingButton } from "@/ui/polling-button";
import { useSandboxTableStore } from "./stores/table-store";
import { Template } from "@/types/api";
import { useRouter } from "next/navigation";

interface SandboxesHeaderProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  templates: Template[];
  table: Table<SandboxWithMetrics>;
}

export function SandboxesHeader({
  searchInputRef,
  templates,
  table,
}: SandboxesHeaderProps) {
  "use no memo";

  const { pollingInterval, setPollingInterval } = useSandboxTableStore();

  const router = useRouter();

  return (
    <header className="mx-3 flex justify-between">
      <div className="flex w-full flex-col gap-8">
        <SearchInput ref={searchInputRef} />
        <SandboxesTableFilters templates={templates} />
      </div>
      <div className="flex w-full flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <PollingButton
            pollingInterval={pollingInterval}
            onIntervalChange={setPollingInterval}
            onRefresh={() => {
              router.refresh();
            }}
          />
          <Badge
            variant="success"
            className="h-min w-fit gap-2 font-bold uppercase"
          >
            {table.getRowCount()} Sandboxes running
            <Circle className="size-2 fill-current" />
          </Badge>
        </div>
        <Badge className="h-min w-fit gap-2 font-bold uppercase">
          {table.getFilteredRowModel().rows.length} / {table.getRowCount()}
        </Badge>
      </div>
    </header>
  );
}
