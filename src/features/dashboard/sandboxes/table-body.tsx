import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { DataTableBody, DataTableCell, DataTableRow } from "@/ui/data-table";
import { Loader } from "@/ui/loader";
import { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { SandboxWithMetrics } from "./table-config";
import { useMemo } from "react";

interface TableBodyProps {
  sandboxesError: Error | undefined;
  sandboxesLoading: boolean;
  sandboxes: SandboxWithMetrics[] | undefined;
  table: Table<SandboxWithMetrics>;
  visualRowsCount: number;
}

export function TableBody({
  sandboxesError,
  sandboxesLoading,
  sandboxes,
  table,
  visualRowsCount,
}: TableBodyProps) {
  "use no memo";

  const { rows } = table.getRowModel();

  const visualRows = useMemo(() => {
    return rows.slice(0, visualRowsCount);
  }, [rows, visualRowsCount]);

  return (
    <DataTableBody>
      {sandboxesError ? (
        <DataTableRow>
          <Alert className="w-full text-left" variant="error">
            <AlertTitle>Error loading sandboxes.</AlertTitle>
            <AlertDescription>{sandboxesError.message}</AlertDescription>
          </Alert>
        </DataTableRow>
      ) : sandboxesLoading ? (
        <DataTableRow>
          <Alert className="w-full text-left" variant="contrast1">
            <AlertTitle className="flex items-center gap-2">
              <Loader variant="compute" />
              Loading sandboxes...
            </AlertTitle>
            <AlertDescription>This may take a moment.</AlertDescription>
          </Alert>
        </DataTableRow>
      ) : sandboxes && visualRows.length ? (
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
