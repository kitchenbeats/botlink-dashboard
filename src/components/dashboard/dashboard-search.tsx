"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useEffect, useState } from "react";

interface DashboardSearchProps {
  className?: string;
}

export default function DashboardSearch({ className }: DashboardSearchProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
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
