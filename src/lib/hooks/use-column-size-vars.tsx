import { Table } from "@tanstack/react-table";
import { useMemo } from "react";

/**
 * Hook to gather all column sizes once and store them as CSS variables.
 */
export function useColumnSizeVars(table: Table<any>) {
  return useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: string } = {};

    headers.forEach((header) => {
      const sizePx = `${header.getSize()}px`;
      colSizes[`--header-${header.id}-size`] = sizePx;
      colSizes[`--col-${header.column.id}-size`] = sizePx;
    });

    return colSizes;
  }, [table.getState().columnSizing, table.getState().columnSizingInfo]);
}
