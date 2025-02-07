import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/ui/primitives/dropdown-menu'
import { DropdownMenuTrigger } from '@/ui/primitives/dropdown-menu'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { Slider } from '@/ui/primitives/slider'
import { Label } from '@/ui/primitives/label'
import { Separator } from '@/ui/primitives/separator'
import { useDebounceValue } from 'usehooks-ts'
import { useSandboxTableStore } from '@/features/dashboard/sandboxes/stores/table-store'
import { Button } from '@/ui/primitives/button'
import { FilterIcon } from 'lucide-react'
import { TableFilterButton } from '@/ui/table-filter-button'
import { Template } from '@/types/api'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/primitives/command'

export type StartedAtFilter = '1h ago' | '6h ago' | '12h ago' | undefined

// Components
const RunningSinceFilter = () => {
  const { startedAtFilter, setStartedAtFilter } = useSandboxTableStore()

  const handleRunningSince = (value?: StartedAtFilter) => {
    if (!value) {
      setStartedAtFilter(undefined)
    } else {
      setStartedAtFilter(value)
    }
  }

  return (
    <div>
      <DropdownMenuItem
        className={cn(startedAtFilter === '1h ago' && 'text-accent')}
        onClick={(e) => {
          e.preventDefault()
          handleRunningSince('1h ago')
        }}
      >
        1 hour ago
      </DropdownMenuItem>
      <DropdownMenuItem
        className={cn(startedAtFilter === '6h ago' && 'text-accent')}
        onClick={(e) => {
          e.preventDefault()
          handleRunningSince('6h ago')
        }}
      >
        6 hours ago
      </DropdownMenuItem>
      <DropdownMenuItem
        className={cn(startedAtFilter === '12h ago' && 'text-accent')}
        onClick={(e) => {
          e.preventDefault()
          handleRunningSince('12h ago')
        }}
      >
        12 hours ago
      </DropdownMenuItem>
    </div>
  )
}

interface TemplateFilterProps {
  templates: Template[]
}

const TemplateFilter = ({ templates }: TemplateFilterProps) => {
  const { templateIds, setTemplateIds } = useSandboxTableStore()

  const handleSelect = (templateId: string) => {
    if (templateIds.includes(templateId)) {
      setTemplateIds(templateIds.filter((id) => id !== templateId))
    } else {
      setTemplateIds([...templateIds, templateId])
    }
  }

  return (
    <Command>
      <CommandInput placeholder="Search templates..." />
      <CommandList>
        {templates?.map((template) => (
          <CommandItem
            key={template.templateID}
            onSelect={() => handleSelect(template.templateID)}
            className={cn(
              templateIds.includes(template.templateID) && 'text-accent'
            )}
          >
            {template.templateID}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}

const ResourcesFilter = () => {
  const { cpuCount, setCpuCount, memoryMB, setMemoryMB } =
    useSandboxTableStore()

  const [localCpuCount, setLocalCpuCount] = React.useState(cpuCount || 0)
  const [localMemoryMB, setLocalMemoryMB] = React.useState(memoryMB || 0)

  const [debouncedCpuCount] = useDebounceValue(localCpuCount, 300)
  const [debouncedMemoryMB] = useDebounceValue(localMemoryMB, 300)

  React.useEffect(() => {
    setCpuCount(debouncedCpuCount || undefined)
  }, [debouncedCpuCount, setCpuCount])

  React.useEffect(() => {
    setMemoryMB(debouncedMemoryMB || undefined)
  }, [debouncedMemoryMB, setMemoryMB])

  return (
    <div className="w-80 p-4">
      <div className="grid gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>CPU Cores</Label>
            <span className="text-xs text-accent">
              {localCpuCount === 0 ? 'Off' : `${localCpuCount} cores`}
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
                ? 'Off'
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
    </div>
  )
}

// Main component
export interface SandboxesTableFiltersProps
  extends React.HTMLAttributes<HTMLDivElement> {
  templates: Template[]
}

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  SandboxesTableFiltersProps
>(({ className, templates, ...props }, ref) => {
  const {
    globalFilter,
    startedAtFilter,
    templateIds,
    cpuCount,
    memoryMB,
    setGlobalFilter,
    setStartedAtFilter,
    setTemplateIds,
    setCpuCount,
    setMemoryMB,
  } = useSandboxTableStore()

  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="iconSm" variant="outline">
            <FilterIcon className="size-4 text-fg-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Filters</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Started</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <RunningSinceFilter />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Template</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <TemplateFilter templates={templates} />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Resources</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <ResourcesFilter />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {globalFilter && (
        <TableFilterButton
          label="Search"
          value={globalFilter}
          onClick={() => setGlobalFilter('')}
        />
      )}
      {startedAtFilter && (
        <TableFilterButton
          label="Started"
          value={startedAtFilter}
          onClick={() => setStartedAtFilter(undefined)}
        />
      )}
      {templateIds.length > 0 &&
        templateIds.map((id) => (
          <TableFilterButton
            key={id}
            label="Template"
            value={id}
            onClick={() => setTemplateIds(templateIds.filter((t) => t !== id))}
          />
        ))}
      {cpuCount !== undefined && (
        <TableFilterButton
          label="CPU"
          value={cpuCount.toString()}
          onClick={() => setCpuCount(undefined)}
        />
      )}
      {memoryMB !== undefined && (
        <TableFilterButton
          label="Memory"
          value={memoryMB.toString()}
          onClick={() => setMemoryMB(undefined)}
        />
      )}
    </div>
  )
})

SandboxesTableFilters.displayName = 'SandboxesTableFilters'

export default SandboxesTableFilters
