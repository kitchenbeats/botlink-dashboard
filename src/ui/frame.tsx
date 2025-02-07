import { cn } from '@/lib/utils'
import Dotted from './dotted'

interface FrameProps {
  children: React.ReactNode
  classNames?: {
    wrapper?: string
    frame?: string
  }
}

export default function Frame({ children, classNames }: FrameProps) {
  return (
    <div
      className={cn(
        'relative flex h-fit w-fit border pb-2',
        classNames?.wrapper
      )}
    >
      <Dotted />
      <div
        className={cn(
          'relative w-full scale-[1.005] border bg-bg shadow-md',
          classNames?.frame
        )}
      >
        {children}
      </div>
    </div>
  )
}
