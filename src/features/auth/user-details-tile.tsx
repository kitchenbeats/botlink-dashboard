'use client'

import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/ui/primitives/button'
import { PROTECTED_URLS } from '@/configs/urls'
import { useTransition } from 'react'
import { signOutAction } from '@/server/auth/auth-actions'
import { Loader } from '@/ui/loader'

interface UserDetailsTileProps {
  user: User
  className?: string
}

export default function UserDetailsTile({
  user,
  className,
}: UserDetailsTileProps) {
  const [isSigningOut, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(() => {
      signOutAction()
    })
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="ghost"
        asChild
        className="group relative h-auto w-full justify-start rounded-none p-3 hover:bg-bg-200"
      >
        <Link href={PROTECTED_URLS.ACCOUNT_SETTINGS}>
          <Avatar className="size-9 shadow-lg">
            <AvatarImage src={user.user_metadata.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col normal-case">
            <h6 className="max-w-[135px] truncate whitespace-nowrap text-sm text-fg-300 transition-colors group-hover:text-fg">
              {user.user_metadata.name}
            </h6>
            <span className="max-w-[140px] truncate whitespace-nowrap font-sans text-xs text-fg-500 transition-colors group-hover:text-fg-300">
              {user.email}
            </span>
          </div>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-full w-36 rounded-none border-l text-error hover:border-error/20 hover:bg-error/10"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader variant="compute" className="size-4" />
        ) : (
          <LogOut className="size-4" />
        )}
      </Button>
    </div>
  )
}
