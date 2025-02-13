import { cn } from '@/lib/utils'

interface DottedProps {
  className?: string
}

export default function Dotted({ className }: DottedProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 h-full w-full overflow-hidden bg-[0_0] bg-[url(/textures/dots.svg)] bg-auto invert',
        className
      )}
    />
  )
}
