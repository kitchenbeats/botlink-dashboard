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
import { Input } from "@/components/ui/input";

export type StartedAtFilter = "1h ago" | "6h ago" | "12h ago" | undefined;

interface SandboxesTableFiltersProps
  extends React.HTMLAttributes<HTMLDivElement> {
  startedAtFilter: StartedAtFilter;
  onStartedAtChange: (value: StartedAtFilter) => void;
  clearStartedAt: () => void;

  setTemplateId: (templateId: string | undefined) => void;
  templateId: string | undefined;

  cpuCount?: number;
  onCpuCountChange: (value?: number) => void;
  memoryMB?: number;
  onMemoryMBChange: (value?: number) => void;
  cpuUsage?: number;
  onCpuUsageChange: (value?: number) => void;
  ramUsage?: number;
  onRamUsageChange: (value?: number) => void;
}

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  SandboxesTableFiltersProps
>(
  (
    {
      className,
      startedAtFilter,
      onStartedAtChange,
      clearStartedAt,
      setTemplateId,
      templateId,
      cpuCount,
      onCpuCountChange,
      memoryMB,
      onMemoryMBChange,
      cpuUsage,
      onCpuUsageChange,
      ramUsage,
      onRamUsageChange,
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
          startedAtFilter={startedAtFilter}
          onStartedAtChange={onStartedAtChange}
          clearStartedAt={clearStartedAt}
        />

        <TemplateFilter setTemplateId={setTemplateId} templateId={templateId} />

        <ResourcesFilter
          cpuCount={cpuCount}
          onCpuCountChange={onCpuCountChange}
          memoryMB={memoryMB}
          onMemoryMBChange={onMemoryMBChange}
          cpuUsage={cpuUsage}
          onCpuUsageChange={onCpuUsageChange}
          ramUsage={ramUsage}
          onRamUsageChange={onRamUsageChange}
        />
      </div>
    );
  },
);

SandboxesTableFilters.displayName = "SandboxesTableFilters";

export default SandboxesTableFilters;

const RunningSinceFilter = ({
  startedAtFilter,
  onStartedAtChange,
  clearStartedAt,
}: {
  startedAtFilter: StartedAtFilter;
  onStartedAtChange: (value: StartedAtFilter) => void;
  clearStartedAt: () => void;
}) => {
  const now = React.useRef(new Date());

  const handleRunningSince = (value?: StartedAtFilter) => {
    if (!value) {
      clearStartedAt();
    } else {
      onStartedAtChange(value);
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

interface ResourcesFilterProps {
  cpuCount?: number;
  onCpuCountChange: (value?: number) => void;
  memoryMB?: number;
  onMemoryMBChange: (value?: number) => void;
  cpuUsage?: number;
  onCpuUsageChange: (value?: number) => void;
  ramUsage?: number;
  onRamUsageChange: (value: number) => void;
}

const ResourcesFilter = React.forwardRef<HTMLDivElement, ResourcesFilterProps>(
  (
    {
      cpuCount,
      onCpuCountChange,
      memoryMB,
      onMemoryMBChange,
      cpuUsage,
      onCpuUsageChange,
      ramUsage,
      onRamUsageChange,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [localCpuCount, setLocalCpuCount] = React.useState(cpuCount || 0);
    const [localMemoryMB, setLocalMemoryMB] = React.useState(memoryMB || 0);

    const [debouncedCpuCount] = useDebounceValue(localCpuCount, 300);
    const [debouncedMemoryMB] = useDebounceValue(localMemoryMB, 300);

    React.useEffect(() => {
      onCpuCountChange(debouncedCpuCount || undefined);
    }, [debouncedCpuCount, onCpuCountChange]);

    React.useEffect(() => {
      onMemoryMBChange(debouncedMemoryMB || undefined);
    }, [debouncedMemoryMB, onMemoryMBChange]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TableFilterButton
            label="Resources"
            value={
              cpuCount || memoryMB || cpuUsage || ramUsage
                ? "Active"
                : undefined
            }
          />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" side="bottom" align="start">
          <div className="grid gap-4">
            {/* <div>
              <h3 className="mb-3 font-medium">Specs</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Cores</Label>
                  <Input
                    type="number"
                    value={localCpuCount}
                    onChange={(e) => setLocalCpuCount(Number(e.target.value))}
                    min={0}
                    max={8}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Memory</Label>
                  <Input
                    type="number"
                    value={localMemoryMB}
                    onChange={(e) => setLocalMemoryMB(Number(e.target.value))}
                    min={0}
                    max={8192}
                    step={512}
                    className="mt-1"
                  />
                </div>
              </div>
            </div> */}

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
                  {localMemoryMB === 0 ? "Off" : `${localMemoryMB} MB`}
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
  },
);

ResourcesFilter.displayName = "ResourcesFilter";
