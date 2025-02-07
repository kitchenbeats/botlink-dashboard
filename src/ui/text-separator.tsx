import { Separator } from './primitives/separator'

interface TextSeparatorProps {
  text: string
}

export default function TextSeparator({ text }: TextSeparatorProps) {
  return (
    <div className="my-6 flex items-center gap-2">
      <Separator className="w-auto flex-grow bg-border-200" />
      <span className="px-2 font-mono text-fg">{text}</span>
      <Separator className="w-auto flex-grow bg-border-200" />
    </div>
  )
}
