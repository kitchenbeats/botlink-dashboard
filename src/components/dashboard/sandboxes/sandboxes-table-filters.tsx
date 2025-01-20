import * as React from "react";

const SandboxesTableFilters = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      Filters
    </div>
  );
});

SandboxesTableFilters.displayName = "SandboxesTableFilters";

export default SandboxesTableFilters;
