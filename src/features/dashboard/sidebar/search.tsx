"use client";

import { Input } from "@/ui/primitives/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/ui/primitives/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/ui/primitives/command";
import { useEffect, useState } from "react";

interface SearchProps {
  className?: string;
}

export default function Search({ className }: SearchProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, []);

  return (
    <div className="relative">
      <Input
        className={cn("w-full pr-12", className)}
        placeholder="JUMP TO"
        onClick={() => setOpen(true)}
        readOnly
      />
      <Badge
        variant="muted"
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        CMD+K
      </Badge>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              Calendar
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Settings
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
