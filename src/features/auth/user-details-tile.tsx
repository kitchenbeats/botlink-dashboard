import { ArrowRight, ChevronRight, Settings2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

interface UserDetailsTileProps {
  user: User
  className?: string
}

export default function UserDetailsTile({
  user,
  className,
}: UserDetailsTileProps) {
  return (
    <div
      className={cn('group relative flex items-center gap-2 pr-4', className)}
    >
      <Avatar className="size-9">
        <AvatarImage src={user.user_metadata.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col normal-case">
        <h6 className="max-w-[140px] truncate whitespace-nowrap text-sm text-fg-300 transition-colors group-hover:text-fg">
          {user.user_metadata.name}
        </h6>
        <span className="max-w-[160px] truncate whitespace-nowrap font-sans text-xs text-fg-500 transition-colors group-hover:text-fg-300">
          {user.email}
        </span>
      </div>
      <Settings2 className="absolute right-0 top-1/2 size-4 -translate-y-1/2 text-accent" />
    </div>
  )
}
