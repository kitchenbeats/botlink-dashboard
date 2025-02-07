import { Table } from '@tanstack/react-table'
import { useMemo } from 'react'

/**
 * Hook to gather all column sizes once and store them as CSS variables.
 * Note: header.id values cannot contain spaces as they are used in CSS variable names.
 */
export function useColumnSizeVars<T extends object>(table: Table<T>) {
  return useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: string } = {}

    headers.forEach((header) => {
      const sizePx = `${header.getSize()}px`
      colSizes[`--header-${header.id}-size`] = sizePx
      colSizes[`--col-${header.column.id}-size`] = sizePx
    })

    return colSizes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizing, table.getState().columnSizingInfo])
}
