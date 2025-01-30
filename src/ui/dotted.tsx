import { cn } from "@/lib/utils";

interface DottedProps {
  className?: string;
}

export default function Dotted({ className }: DottedProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden bg-[url(/textures/dots.svg)] bg-auto bg-[0_0] invert",
        className,
      )}
    />
  );
}
