'use client'

import useIsMounted from '@/lib/hooks/use-is-mounted'
import { Button } from '@/ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/ui/primitives/dropdown-menu'
import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

const ThemeSwitcher = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isMounted = useIsMounted()

  if (!isMounted) {
    return null
  }

  const ICON_SIZE = 16

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={'iconSm'}>
          {resolvedTheme === 'light' ? (
            <Sun key="light" size={ICON_SIZE} className={'text-fg-300'} />
          ) : (
            <Moon key="dark" size={ICON_SIZE} className={'text-fg-300'} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[130px]" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem
            className="flex items-center gap-2"
            value="light"
          >
            <Sun className="size-3.5 text-fg-300" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex items-center gap-2"
            value="dark"
          >
            <Moon className="size-3.5 text-fg-300" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex items-center gap-2"
            value="system"
          >
            <Laptop className="size-3.5 text-fg-300" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeSwitcher }
