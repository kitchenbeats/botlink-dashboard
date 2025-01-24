import type { LucideIcon } from "lucide-react";
import { TerminalIcon } from "lucide-react";
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function IconContainer({
  icon: Icon,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon;
}): React.ReactElement {
  return (
    <div
      {...props}
      className={cn(
        "rounded-md border bg-gradient-to-b from-bg to-bg-100 p-2 [a[data-active=true]_&]:from-accent/60 [a[data-active=true]_&]:to-accent [a[data-active=true]_&]:text-accent-fg",
        props.className
      )}
    >
      {Icon ? (
        <Icon className="w-4 h-4" />
      ) : (
        <TerminalIcon className="w-4 h-4" />
      )}
    </div>
  );
}
