import Link from 'next/link'
import { FileIcon } from 'lucide-react'
import { Button } from '@/ui/primitives/button'
import { Avatar, AvatarFallback } from '@/ui/primitives/avatar'

const tabs = [
  {
    title: 'Documentation',
    description: 'The E2B documentation',
    url: '/docs',
    icon: FileIcon,
  },
]

export default function Header() {
  return (
    <div className="mb-4 flex flex-col gap-2">
      {tabs.map((tab) => (
        <Button key={tab.url} variant="outline" className="h-auto p-2" asChild>
          <Link
            key={tab.url}
            href={tab.url}
            className="group flex w-full items-center justify-start gap-2"
          >
            <Avatar className="size-9">
              <AvatarFallback className="text-fg">
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
