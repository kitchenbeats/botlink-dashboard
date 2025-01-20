import { cn } from "@/lib/utils";
import * as React from "react";

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("bg-bg-100", className)} {...props}>
      Filters
    </div>
  );
});

SandboxesTableFilters.displayName = "SandboxesTableFilters";

export default SandboxesTableFilters;
