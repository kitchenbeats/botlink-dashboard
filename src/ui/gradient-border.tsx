import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

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

export const GradientBorder = forwardRef<HTMLDivElement, GradientBorderProps>(
  (
    {
      children,
      wrapperClassName,
      className,
      gradientFrom = "from-border-100",
      gradientVia = "via-border-200",
      gradientTo = "to-transparent",
      direction = "bg-gradient-to-b",
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "transform-gpu rounded-[1px] p-[0.5px]",
          direction,
          gradientFrom,
          gradientVia,
          gradientTo,
          wrapperClassName,
        )}
      >
        <div className={cn("rounded-[1px] bg-bg", className)}>{children}</div>
      </div>
    );
  },
);

GradientBorder.displayName = "GradientBorder";
