import Link from 'next/link'
import { FileIcon, LinkIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/ui/primitives/button'
import { Avatar, AvatarFallback } from '@/ui/primitives/avatar'

const tabs = [
  {
    title: 'Documentation',
    description: 'The E2B documentation',
    url: '/docs',
    icon: FileIcon,
  },
  {
    title: 'Reference',
    description: 'SDK & API Reference',
    url: '/docs/reference',
    icon: LinkIcon,
  },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <div className="mt-12 mb-4 space-y-1">
      {tabs.map((tab) => (
        <Button key={tab.url} variant="ghost" className="h-auto p-0" asChild>
          <Link
            key={tab.url}
            href={tab.url}
            className="group flex w-full items-center justify-start gap-2"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-fg-100 text-bg">
                <tab.icon className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-fg-100 font-mono">{tab.title}</span>
              <p className="text-fg-500 text-[0.65rem]">{tab.description}</p>
            </div>
          </Link>
        </Button>
      ))}
    </div>
  )
}
