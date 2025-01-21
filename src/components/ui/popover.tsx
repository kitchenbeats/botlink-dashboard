"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { GradientBorder } from "./gradient-border";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverPortal = PopoverPrimitive.Portal;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    {
      className,
      align = "center",
      sideOffset = 10,
      collisionPadding = 10,
      children,
      ...props
    },
    ref,
  ) => (
    <PopoverPortal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      >
        <GradientBorder
          gradientFrom="from-border-100"
          gradientVia="via-border"
          gradientTo="to-border/60 to-60%"
          wrapperClassName="animate-in fade-in-0 slide-in-from-bottom-1 duration-100 rounded-md"
          className={cn(
            "z-50 w-72 rounded-md bg-bg/80 p-3 shadow-lg outline-none backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
        >
          {children}
        </GradientBorder>
      </PopoverPrimitive.Content>
    </PopoverPortal>
  ),
);

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
