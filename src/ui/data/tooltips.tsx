import { cn } from '@/lib/utils'
import { cardVariants } from '../primitives/card'

interface DefaultTooltipProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children?: React.ReactNode
}

export default function DefaultTooltip({
  title,
  subtitle,
  children,
}: DefaultTooltipProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant: 'layer' }),
        'border shadow-md p-3 min-w-42'
      )}
    >
      <div className="flex flex-col gap-2">
        <h4 className="">{title}</h4>
        {subtitle && <span className="text-fg-tertiary">{subtitle}</span>}
      </div>
      {children && <div>{children}</div>}
    </div>
  )
}
