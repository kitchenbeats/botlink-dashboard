"use client";

import { MAIN_DASHBOARD_LINKS } from "@/configs/dashboard-navs";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dotted from "@/ui/dotted";

interface NavbarItemProps {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function NavbarItem({ label, href, icon: Icon }: NavbarItemProps) {
  const pathname = usePathname();
  const params = useParams();

  return (
    <Link
      prefetch
      href={href}
      suppressHydrationWarning
      className={cn(
        "ring-border group relative w-full transition-all duration-200 hover:no-underline hover:ring-1",
        pathname === href ? "text-accent" : "text-fg-300 hover:text-fg",
      )}
    >
      <Dotted className="z-0" />
      <div
        className={cn(
          "bg-bg ring-border relative z-10 transition-all duration-200",
          "group-hover:-translate-y-[4px] group-hover:scale-[1.005] group-hover:shadow-sm group-hover:ring-1 dark:group-hover:shadow-md",
        )}
      >
        <div className="bg-bg flex w-full items-center font-mono text-sm">
          <div className="flex w-full items-center gap-1 px-2 py-1">
            <Icon className={cn("text-fg-500 mr-2 w-4")} />
            <span className="shrink-0">{label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
