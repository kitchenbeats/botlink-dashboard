import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { subHours } from "date-fns";
import * as React from "react";
import { DateRange } from "react-day-picker";
import { TableFilterButton } from "../table-filter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTemplates } from "@/hooks/use-templates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";

interface SandboxesTableFiltersProps
  extends React.HTMLAttributes<HTMLDivElement> {
  setDateRange: (dateRange: DateRange) => void;
  clearDateRange: () => void;

  setTemplateId: (templateId: string | undefined) => void;
  templateId: string | undefined;
}

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  SandboxesTableFiltersProps
>(
  (
    {
      className,
      setDateRange,
      clearDateRange,
      setTemplateId,
      templateId,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-4", className)}
        {...props}
      >
        <RunningSinceFilter
          setDateRange={setDateRange}
          clearDateRange={clearDateRange}
        />

        <TemplateFilter setTemplateId={setTemplateId} templateId={templateId} />
      </div>
    );
  },
);

SandboxesTableFilters.displayName = "SandboxesTableFilters";

export default SandboxesTableFilters;

const RunningSinceFilter = ({
  setDateRange,
  clearDateRange,
}: {
  setDateRange: (dateRange: DateRange) => void;
  clearDateRange: () => void;
}) => {
  const [runningSince, setRunningSince] = React.useState<string | undefined>();

  const now = React.useRef(new Date());

  const nowText = now.current.toTimeString();

  const handleRunningSince = (value?: "1h" | "6h" | "12h") => {
    setRunningSince(value);

    if (!value) {
      clearDateRange();
    } else {
      const now = new Date();
      setDateRange({
        from: subHours(now, value === "1h" ? 1 : value === "6h" ? 6 : 12),
        to: now,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TableFilterButton label="Started" value={runningSince} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {runningSince && (
          <DropdownMenuItem
            onClick={() => handleRunningSince()}
            className="mb-2 bg-accent/10 text-accent"
          >
            Clear
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleRunningSince("1h")}>
          1 hour ago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRunningSince("6h")}>
          6 hours ago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRunningSince("12h")}>
          12 hours ago
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TemplateFilter = ({
  setTemplateId,
  templateId,
}: {
  setTemplateId: (templateId: string | undefined) => void;
  templateId: string | undefined;
}) => {
  const [open, setOpen] = React.useState(false);

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates({
    revalidateOnFocus: false,
  });

  const handleSelect = (templateId: string) => {
    setTemplateId(templateId);
    setOpen(false);
  };

  const handleClear = () => {
    setTemplateId(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TableFilterButton label="Template" value={templateId} />
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            {templateId && (
              <CommandItem
                onSelect={handleClear}
                className="mb-1 bg-accent/10 text-accent"
              >
                Clear
              </CommandItem>
            )}
            {templatesLoading ? (
              <div className="p-4 text-center">
                <Loader variant="dots" className="text-accent" />
              </div>
            ) : templatesError ? (
              <Alert variant="error" className="m-2">
                <AlertTitle>Error loading templates</AlertTitle>
                <AlertDescription>{templatesError.message}</AlertDescription>
              </Alert>
            ) : templates?.length === 0 ? (
              <div className="p-4 text-center text-sm text-fg-500">
                No templates found
              </div>
            ) : (
              templates?.map((template) => (
                <CommandItem
                  key={template.templateID}
                  onSelect={() => handleSelect(template.templateID)}
                >
                  {template.templateID}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
