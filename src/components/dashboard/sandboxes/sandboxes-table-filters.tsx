import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import * as React from "react";
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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDebounceValue } from "usehooks-ts";
import { useSandboxTableStore } from "@/stores/sandbox-table-store";

export type StartedAtFilter = "1h ago" | "6h ago" | "12h ago" | undefined;

// Components
const RunningSinceFilter = () => {
  const { startedAtFilter, setStartedAtFilter, resetFilters } =
    useSandboxTableStore();

  const handleRunningSince = (value?: StartedAtFilter) => {
    if (!value) {
      resetFilters();
    } else {
      setStartedAtFilter(value);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TableFilterButton label="Started" value={startedAtFilter} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {startedAtFilter && (
          <DropdownMenuItem
            onClick={() => handleRunningSince()}
            className="mb-2 bg-accent/10 text-accent"
          >
            Clear
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleRunningSince("1h ago")}>
          1 hour ago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRunningSince("6h ago")}>
          6 hours ago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRunningSince("12h ago")}>
          12 hours ago
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TemplateFilter = () => {
  const [open, setOpen] = React.useState(false);
  const { templateId, setTemplateId } = useSandboxTableStore();

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

const ResourcesFilter = () => {
  const [open, setOpen] = React.useState(false);
  const { cpuCount, setCpuCount, memoryMB, setMemoryMB } =
    useSandboxTableStore();

  const [localCpuCount, setLocalCpuCount] = React.useState(cpuCount || 0);
  const [localMemoryMB, setLocalMemoryMB] = React.useState(memoryMB || 0);

  const [debouncedCpuCount] = useDebounceValue(localCpuCount, 300);
  const [debouncedMemoryMB] = useDebounceValue(localMemoryMB, 300);

  React.useEffect(() => {
    setCpuCount(debouncedCpuCount || undefined);
  }, [debouncedCpuCount, setCpuCount]);

  React.useEffect(() => {
    setMemoryMB(debouncedMemoryMB || undefined);
  }, [debouncedMemoryMB, setMemoryMB]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TableFilterButton
          label="Resources"
          value={cpuCount || memoryMB ? "Active" : undefined}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="bottom" align="start">
        <div className="grid gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>CPU Cores</Label>
              <span className="text-xs text-accent">
                {localCpuCount === 0 ? "Off" : `${localCpuCount} cores`}
              </span>
            </div>
            <div>
              <Slider
                value={[localCpuCount]}
                onValueChange={([value]) => setLocalCpuCount(value)}
                max={8}
                step={1}
                className="[&_.slider-range]:bg-transparent [&_.slider-thumb]:border-fg-500 [&_.slider-thumb]:bg-bg [&_.slider-track]:bg-fg-100"
              />
              <div className="mt-3 flex justify-between text-xs text-fg-500">
                <span>Off</span>
                <span>8</span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Memory</Label>
              <span className="text-xs text-accent">
                {localMemoryMB === 0
                  ? "Off"
                  : localMemoryMB < 1024
                    ? `${localMemoryMB} MB`
                    : `${localMemoryMB / 1024} GB`}
              </span>
            </div>
            <div>
              <Slider
                value={[localMemoryMB]}
                onValueChange={([value]) => setLocalMemoryMB(value)}
                max={8192}
                step={512}
                className="[&_.slider-range]:bg-transparent [&_.slider-thumb]:border-fg-500 [&_.slider-thumb]:bg-bg [&_.slider-track]:bg-fg-100"
              />
              <div className="mt-3 flex justify-between text-xs text-fg-500">
                <span>Off</span>
                <span>8GB</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Main component
export interface SandboxesTableFiltersProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  SandboxesTableFiltersProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-4", className)}
      {...props}
    >
      <RunningSinceFilter />
      <TemplateFilter />
      <ResourcesFilter />
    </div>
  );
});

SandboxesTableFilters.displayName = "SandboxesTableFilters";

export default SandboxesTableFilters;
