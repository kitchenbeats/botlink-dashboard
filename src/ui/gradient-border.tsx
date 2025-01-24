import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GradientBorderProps {
  children: ReactNode;
  wrapperClassName?: string;
  className?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  direction?:
    | "bg-gradient-to-t"
    | "bg-gradient-to-tr"
    | "bg-gradient-to-r"
    | "bg-gradient-to-br"
    | "bg-gradient-to-b"
    | "bg-gradient-to-bl"
    | "bg-gradient-to-l"
    | "bg-gradient-to-tl";
}

export function GradientBorder({
  children,
  wrapperClassName,
  className,
  gradientFrom = "from-border-100",
  gradientVia = "via-border-200",
  gradientTo = "to-transparent",
  direction = "bg-gradient-to-b",
}: GradientBorderProps) {
  return (
    <div
      className={cn(
        "p-[0.5px] rounded-[1px] transform-gpu",
        direction,
        gradientFrom,
        gradientVia,
        gradientTo,
        wrapperClassName
      )}
    >
      <div className={cn("bg-bg rounded-[1px]", className)}>{children}</div>
    </div>
  );
}
