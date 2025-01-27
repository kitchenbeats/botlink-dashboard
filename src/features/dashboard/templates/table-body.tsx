import { Table } from "@tanstack/react-table";
import { Template } from "@/types/api";
import { DataTableBody, DataTableRow, DataTableCell } from "@/ui/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { AssemblyLoader, Loader } from "@/ui/loader";
import { flexRender } from "@tanstack/react-table";

interface TableBodyProps {
  templatesError: Error | null;
  templatesLoading: boolean;
  templates: Template[] | undefined;
  table: Table<Template>;
}

export function TableBody({
  templatesError,
  templatesLoading,
  templates,
  table,
}: TableBodyProps) {
  "use no memo";

  return (
    <DataTableBody>
      {templatesError ? (
        <DataTableRow>
          <Alert className="w-full text-left" variant="error">
            <AlertTitle>Error loading templates.</AlertTitle>
            <AlertDescription>{templatesError.message}</AlertDescription>
          </Alert>
        </DataTableRow>
      ) : templatesLoading || !templates ? (
        <AssemblyLoader
          className="p-6"
          gridWidth={12}
          interval={6}
          emptyChar=" "
          filledChar="░"
        />
      ) : templates && table.getRowModel()?.rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <DataTableRow key={row.id} className="h-8">
            {row.getVisibleCells().map((cell) => (
              <DataTableCell key={cell.id} cell={cell}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </DataTableCell>
            ))}
          </DataTableRow>
        ))
      ) : (
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
  );
}
