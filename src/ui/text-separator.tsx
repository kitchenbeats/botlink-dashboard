import { Separator } from "./primitives/separator";

interface TextSeparatorProps {
  text: string;
}

export default function TextSeparator({ text }: TextSeparatorProps) {
  return (
    <div className="my-6 flex items-center gap-2">
      <Separator className="bg-border-200 w-auto flex-grow" />
      <span className="text-fg px-2 font-mono">{text}</span>
      <Separator className="bg-border-200 w-auto flex-grow" />
    </div>
  );
}
