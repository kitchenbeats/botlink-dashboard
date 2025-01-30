"use client";

import { DebouncedInput } from "@/ui/primitives/input";
import { Kbd } from "@/ui/primitives/kbd";
import { forwardRef, useEffect } from "react";
import { useTemplateTableStore } from "./stores/table-store";

export const SearchInput = forwardRef<HTMLInputElement, {}>((props, ref) => {
  const { globalFilter, setGlobalFilter } = useTemplateTableStore();

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "/") {
          e.preventDefault();
          if (ref && "current" in ref) {
            (ref as React.RefObject<HTMLInputElement>).current?.focus();
          }
          return true;
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [ref]);

  return (
    <div className="relative w-full max-w-[420px]">
      <DebouncedInput
        value={globalFilter}
        onChange={(v) => setGlobalFilter(v as string)}
        placeholder="Find template..."
        className="h-10 w-full pr-14"
        ref={ref}
        debounce={500}
        {...props}
      />
      <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
    </div>
  );
});

SearchInput.displayName = "SearchInput";
