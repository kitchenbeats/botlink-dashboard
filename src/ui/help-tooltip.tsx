import { InfoIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from './primitives/tooltip'

interface HelpTooltipProps {
  children: React.ReactNode
}

export default function HelpTooltip({ children }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger tabIndex={-1}>
          <InfoIcon className="size-4 text-fg-500" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] p-2 text-xs text-fg-300">
          <InfoIcon className="mb-2 size-4 text-fg-500" />
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
