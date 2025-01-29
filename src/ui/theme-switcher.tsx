"use client";

import useIsMounted from "@/lib/hooks/use-is-mounted";
import { Button } from "@/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"iconSm"}>
          {theme === "light" ? (
            <Sun key="light" size={ICON_SIZE} className={"text-fg-300"} />
          ) : theme === "dark" ? (
            <Moon key="dark" size={ICON_SIZE} className={"text-fg-300"} />
          ) : (
            <Laptop key="system" size={ICON_SIZE} className={"text-fg-300"} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem
            className="flex justify-between gap-2"
            value="light"
          >
            <span>Light</span>
            <Sun size={ICON_SIZE} className="text-fg-300" />{" "}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex justify-between gap-2"
            value="dark"
          >
            <span>Dark</span>
            <Moon size={ICON_SIZE} className="text-fg-300" />{" "}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex justify-between gap-2"
            value="system"
          >
            <span>System</span>
            <Laptop size={ICON_SIZE} className="text-fg-300" />{" "}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
