import { cn } from '@/lib/utils'
import { ArrowUpRight, ChevronRight } from 'lucide-react'

interface ExternalIconProps {
  className?: string
}

export default function ExternalIcon({ className }: ExternalIconProps) {
  return (
    <ArrowUpRight
      className={cn('text-accent size-4 -translate-y-[1px]', className)}
    />
  )
}
