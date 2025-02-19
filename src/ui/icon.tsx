import type { LucideIcon } from 'lucide-react'
import { TerminalIcon } from 'lucide-react'
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function IconContainer({
  icon: Icon,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon
}): React.ReactElement<unknown> {
  return (
    <div
      {...props}
      className={cn(
        '[a[data-active=true]_&]:text-accent-fg from-bg to-bg-100 [a[data-active=true]_&]:from-accent/60 [a[data-active=true]_&]:to-accent rounded-sm border bg-gradient-to-b p-2',
        props.className
      )}
    >
      {Icon ? (
        <Icon className="h-4 w-4" />
      ) : (
        <TerminalIcon className="h-4 w-4" />
      )}
    </div>
  )
}
