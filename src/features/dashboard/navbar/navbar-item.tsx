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
    <div
      key={label}
      className={cn(
        "group relative w-full ring-border transition-all duration-200 hover:ring-1",
      )}
    >
      <Dotted className="z-0" />
      <div
        className={cn(
          "relative z-10 bg-bg ring-border transition-all duration-200",
          "group-hover:-translate-y-[4px] group-hover:scale-[1.005] group-hover:shadow-sm group-hover:ring-1 dark:group-hover:shadow-md",
        )}
      >
        <Link
          prefetch
          href={href}
          suppressHydrationWarning
          className={cn(
            "group flex w-full items-center rounded-md bg-bg font-mono text-sm hover:no-underline",
            pathname === href ? "text-accent" : "text-fg-500 hover:text-fg-300",
          )}
        >
          <div className="flex w-full items-center gap-1 px-2 py-1">
            <Icon
              className={cn(
                "mr-2 w-4 text-fg-300",
                pathname === href ? "text-accent" : "text-fg-300",
              )}
            />
            <span className="shrink-0">{label}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
