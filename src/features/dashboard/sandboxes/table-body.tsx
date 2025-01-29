import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { DataTableBody, DataTableCell, DataTableRow } from "@/ui/data-table";
import { AssemblyLoader } from "@/ui/loader";
import { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { SandboxWithMetrics } from "./table-config";
import { useMemo } from "react";

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

  const centerRows = table.getCenterRows();

  const visualRows = useMemo(() => {
    return centerRows.slice(0, visualRowsCount);
  }, [centerRows, visualRowsCount]);

  return (
    <DataTableBody>
      {sandboxes && visualRows?.length > 0 ? (
        <>
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
        </>
      ) : (
        <DataTableRow suppressHydrationWarning>
          <Alert
            className="w-full text-left"
            suppressHydrationWarning
            variant="contrast2"
          >
            <AlertTitle suppressHydrationWarning>
              No sandboxes found.
            </AlertTitle>
            <AlertDescription suppressHydrationWarning>
              Start more Sandboxes or try different filters.
            </AlertDescription>
          </Alert>
        </DataTableRow>
      )}
    </DataTableBody>
  );
}
