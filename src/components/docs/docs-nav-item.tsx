"use client";

import { isActive } from "@/lib/docs-utils";
import { cn } from "@/lib/utils";
import { SidebarComponents } from "fumadocs-ui/layouts/docs/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DocsNavItem: SidebarComponents["Item"] = ({ item }) => {
  const pathname = usePathname();
  const active = isActive(item.url, pathname, true);

  return (
    <Link
      href={item.url}
      className={cn(
        "group flex w-full items-center font-mono text-sm text-fg-500 hover:no-underline",
        active && "text-fg",
      )}
    >
      <div className="flex w-full items-center gap-1 px-2 py-1">
        {item.icon}
        <span className="shrink-0">{item.name}</span>
        <span className="w-full overflow-hidden font-mono leading-[1.15] text-fg-500">
          {".".repeat(20)}
        </span>
      </div>
    </Link>
  );
};

export default DocsNavItem;
