import { Suspense } from 'react'
import TemplatesTableFilters from './table-filters'
import { SearchInput } from './table-search'

 
interface TemplatesHeaderProps {}

export default function TemplatesHeader({}: TemplatesHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3">
      <div className="flex w-full flex-col gap-8">
        <Suspense fallback={null}>
          <SearchInput />
          <TemplatesTableFilters />
        </Suspense>
      </div>
    </div>
  )
}
