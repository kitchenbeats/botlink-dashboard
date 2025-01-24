import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Kbd: React.FC<KbdProps> = ({ className, children, ...props }) => {
  return (
    <Badge
      variant="muted"
      className={cn("font-mono text-xs", className)}
      {...props}
    >
      {children}
    </Badge>
  );
};

export { Kbd };
