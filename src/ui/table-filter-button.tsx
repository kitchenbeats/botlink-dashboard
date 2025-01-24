import { X } from "lucide-react";
import { Button } from "./primitives/button";
import React from "react";
import { Separator } from "./primitives/separator";

interface TableFilterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  value: string;
}

export const TableFilterButton = React.forwardRef<
  HTMLButtonElement,
  TableFilterButtonProps
>(({ label, value, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className="max-w-56 text-xs"
      suppressHydrationWarning
      {...props}
    >
      <X className={"size-3.5"} />
      {label}
      {value && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <span className="truncate text-accent">{value}</span>
        </>
      )}
    </Button>
  );
});

TableFilterButton.displayName = "TableFilterButton";
