'use client'

import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/ui/primitives/button'
import { PROTECTED_URLS } from '@/configs/urls'
import { useTransition } from 'react'
import { signOutAction } from '@/server/auth/auth-actions'
import { Loader } from '@/ui/loader'
import { useUser } from '@/lib/hooks/use-user'

interface UserDetailsTileProps {
  className?: string
}

export default function UserDetailsTile({ className }: UserDetailsTileProps) {
  const { user } = useUser()
  const [isSigningOut, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(() => {
      signOutAction()
    })
  }

  return (
    <div className={cn('flex h-14 items-center', className)}>
      <Button
        variant="ghost"
        asChild
        className="group hover:bg-bg-200 relative h-auto w-full justify-start rounded-none p-3"
      >
        <Link href={PROTECTED_URLS.ACCOUNT_SETTINGS}>
          <Avatar className="size-9 drop-shadow-md filter">
            <AvatarImage src={user.user_metadata.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col normal-case">
            <h6 className="text-fg-300 group-hover:text-fg max-w-[135px] truncate text-sm whitespace-nowrap transition-colors">
              {user.user_metadata.name}
            </h6>
            <span className="text-fg-500 group-hover:text-fg-300 max-w-[140px] truncate font-sans text-xs whitespace-nowrap transition-colors">
              {user.email}
            </span>
          </div>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-error hover:border-error/20 hover:bg-error/10 h-full w-16 rounded-none border-l"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader className="size-4" />
        ) : (
          <LogOut className="size-4" />
        )}
      </Button>
    </div>
  )
}
