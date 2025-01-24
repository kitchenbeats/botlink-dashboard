"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LogoWithoutText({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className={cn("h-10 w-10", className)} />;

  const logo =
    resolvedTheme === "dark" ? "/meta/logo-dark.svg" : "/meta/logo-light.svg";

  return (
    <img
      src={logo}
      alt="logo"
      className={cn("h-10 w-10", className)}
      suppressHydrationWarning
    />
  );
}
