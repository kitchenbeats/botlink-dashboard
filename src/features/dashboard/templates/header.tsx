import TemplatesTableFilters from "./table-filters";
import { SearchInput } from "./table-search";

interface TemplatesHeaderProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function TemplatesHeader({
  searchInputRef,
}: TemplatesHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3">
      <div className="flex w-full flex-col gap-8">
        <SearchInput ref={searchInputRef} />
        <TemplatesTableFilters />
      </div>
    </div>
  );
}
