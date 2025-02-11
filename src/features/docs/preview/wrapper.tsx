import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export function Wrapper(
  props: HTMLAttributes<HTMLDivElement>
): React.ReactElement<unknown> {
  return (
    <div
      {...props}
      className={cn(
        'prose-no-margin rounded-xl bg-gradient-to-br from-pink-500 to-blue-500 p-4',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
