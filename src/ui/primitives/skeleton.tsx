import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-bg-100', className)}
      {...props}
    />
  )
}

export { Skeleton }
