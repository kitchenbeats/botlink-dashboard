import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import React from "react";
import { Separator } from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

interface TableFilterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  value?: string;
}

export const TableFilterButton = React.forwardRef<
  HTMLButtonElement,
  TableFilterButtonProps
>(({ label, value, ...props }, ref) => {
  return (
    <Button ref={ref} variant="outline" size="sm" {...props}>
      <Plus
        className={cn(
          "size-3.5 transition-transform ease-in-out",
          value && "rotate-45",
        )}
      />
      {label}
      {value && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <span className="normal-case text-accent">{value}</span>
        </>
      )}
    </Button>
  );
});

TableFilterButton.displayName = "TableFilterButton";
