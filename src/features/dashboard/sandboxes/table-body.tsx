import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { DataTableBody, DataTableCell, DataTableRow } from "@/ui/data-table";
import { AssemblyLoader } from "@/ui/loader";
import { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { SandboxWithMetrics } from "./table-config";
import { useMemo } from "react";
import Empty from "@/ui/empty";
import { Button } from "@/ui/primitives/button";
import { useTemplateTableStore } from "../templates/stores/table-store";
import { useSandboxTableStore } from "./stores/table-store";

interface TableBodyProps {
  sandboxes: SandboxWithMetrics[] | undefined;
  table: Table<SandboxWithMetrics>;
  visualRowsCount: number;
}

export function TableBody({
  sandboxes,
  table,
  visualRowsCount,
}: TableBodyProps) {
  "use no memo";

  const resetFilters = useSandboxTableStore((state) => state.resetFilters);

  const centerRows = table.getCenterRows();

  const visualRows = useMemo(() => {
    return centerRows.slice(0, visualRowsCount);
  }, [centerRows, visualRowsCount]);

  const isEmpty = sandboxes && visualRows?.length === 0;

  if (isEmpty) {
    return (
      <Empty
        title="No Sandboxes Found"
        description={
          <>
            Create a new sandbox to get started or{" "}
            <Button
              variant="link"
              size="sm"
              className="normal-case"
              onClick={resetFilters}
            >
              reset
            </Button>
            your filters
          </>
        }
        className="h-[70%] max-md:w-screen"
      />
    );
  }

  return (
    <DataTableBody>
      {visualRows.map((row) => (
        <DataTableRow
          key={row.id}
          isSelected={row.getIsSelected()}
          className="cursor-pointer"
        >
          {row.getVisibleCells().map((cell) => (
            <DataTableCell key={cell.id} cell={cell}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </DataTableCell>
          ))}
        </DataTableRow>
      ))}
    </DataTableBody>
  );
}
