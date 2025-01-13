"use client";

import { useMetadata } from "@/components/providers/metadata-provider";
import { Button } from "@/components/ui/button";
import { DashboardNavLink } from "@/configs/dashboard-navs";
import {
  MAIN_DASHBOARD_LINKS,
  SETTINGS_DASHBOARD_LINKS,
} from "@/configs/dashboard-navs";
import { PROTECTED_URLS } from "@/configs/urls";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import {
  AnimatePresence,
  motion,
  LazyMotion,
  domAnimation,
} from "motion/react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useSelectedLayoutSegments,
} from "next/navigation";
import { useMemo } from "react";

// Move variants outside component to prevent recreation
const terminalFrameVariants = {
  initial: (direction: "deeper" | "back") => ({
    x: direction === "deeper" ? 30 : -30,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: (direction: "deeper" | "back") => ({
    x: direction === "deeper" ? -30 : 30,
    opacity: 0,
    transition: { duration: 0.1 },
  }),
};

const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.03, // Reduced delay
      duration: 0.15,
    },
  }),
  exit: { opacity: 0, x: 10 },
};

type GroupedLinks = {
  [key: string]: DashboardNavLink[];
};

// Memoize grouped links creation
const createGroupedLinks = (links: DashboardNavLink[]): GroupedLinks => {
  return links.reduce((acc, link) => {
    const group = link.group || "ungrouped";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(link);
    return acc;
  }, {} as GroupedLinks);
};

export default function DasboardNav() {
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const params = useParams();
  const { selectedTeamId } = useMetadata();

  const level: "main" | "settings" = useMemo(
    () =>
      segments.includes("settings") || segments.includes("account")
        ? "settings"
        : "main",
    [segments],
  );

  const navLinks = useMemo(
    () =>
      level === "settings" ? SETTINGS_DASHBOARD_LINKS : MAIN_DASHBOARD_LINKS,
    [level],
  );

  const direction = useMemo(
    () => (level === "main" ? "back" : "deeper"),
    [level],
  );

  const groupedNavLinks = useMemo(
    () => createGroupedLinks(navLinks),
    [navLinks],
  );

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={level}
          custom={direction}
          variants={terminalFrameVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative h-full w-48"
        >
          {level !== "main" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <Button
                variant="link"
                size="slate"
                className="gap-1 font-mono"
                asChild
              >
                <Link
                  prefetch
                  suppressHydrationWarning
                  href={
                    selectedTeamId
                      ? PROTECTED_URLS.SANDBOXES(selectedTeamId)
                      : PROTECTED_URLS.DASHBOARD
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </motion.div>
          )}

          <div>
            {Object.entries(groupedNavLinks).map(([group, links]) => (
              <div
                key={group}
                className="mt-6 flex w-full flex-col gap-1 first:mt-0"
              >
                {group !== "ungrouped" && (
                  <div className="mb-2 font-mono text-xs uppercase text-fg-500">
                    == {group}
                  </div>
                )}
                {links.map((item, index) => (
                  <motion.div
                    key={item.label}
                    custom={index}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full"
                  >
                    <Link
                      prefetch
                      href={item.href({ teamId: selectedTeamId })}
                      suppressHydrationWarning
                      className={cn(
                        "group flex w-full items-center font-mono text-sm hover:no-underline",
                        pathname ===
                          item.href({
                            teamId: params.teamId as string | undefined,
                          })
                          ? "text-fg"
                          : "text-fg-500",
                      )}
                    >
                      <div className="flex w-full items-center gap-1 px-2 py-1">
                        <item.icon className="mr-2 min-w-3.5 text-fg-300" />
                        <span className="shrink-0">{item.label}</span>
                        <span className="w-full overflow-hidden font-mono leading-[1.15] text-fg-500">
                          {".".repeat(20)}
                        </span>
                        {item.goesDeeper && (
                          <span className="shrink-0">{">>>"}</span>
                        )}
                        {pathname ===
                          item.href({
                            teamId: params.teamId as string | undefined,
                          }) && <span className="shrink-0 text-fg">{"*"}</span>}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
