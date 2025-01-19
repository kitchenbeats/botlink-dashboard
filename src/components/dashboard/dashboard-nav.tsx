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

const terminalFrameVariants = {
  initial: () => ({
    x: 0,
    opacity: 1,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: () => ({
    x: 0,
    opacity: 1,
    transition: { duration: 0 },
  }),
};

const itemVariants = {
  initial: { opacity: 1, x: 0 },
  animate: () => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0,
    },
  }),
  exit: { opacity: 1, x: 0 },
};

type GroupedLinks = {
  [key: string]: DashboardNavLink[];
};

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

interface DashboardNavProps {
  className?: string;
}

export default function DasboardNav({ className }: DashboardNavProps) {
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
        <motion.nav
          key={level}
          custom={direction}
          variants={terminalFrameVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn("relative h-full", className)}
        >
          {level !== "main" && (
            <motion.div
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: 0 }}
              transition={{ duration: 0 }}
              className="mb-4"
            >
              <Button
                variant="link"
                size="slate"
                className="mt-2 gap-1 font-mono"
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
                  <div className="mb-2 ml-1 font-mono text-xs uppercase text-fg-300">
                    {group}
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
                      shallow
                      prefetch
                      href={item.href({ teamId: selectedTeamId })}
                      suppressHydrationWarning
                      className={cn(
                        "group flex w-full items-center font-mono text-sm hover:no-underline",
                        pathname ===
                          item.href({
                            teamId: params.teamId as string | undefined,
                          })
                          ? "text-accent"
                          : "text-fg-500 hover:text-fg-300",
                        {
                          "mt-4": item.goesDeeper,
                        },
                      )}
                    >
                      <div className="flex w-full items-center gap-1 px-2 py-1">
                        <item.icon
                          className={cn(
                            "mr-2 w-4 text-fg-300",
                            pathname ===
                              item.href({
                                teamId: params.teamId as string | undefined,
                              })
                              ? "text-accent"
                              : "text-fg-300",
                          )}
                        />
                        <span className="shrink-0">{item.label}</span>
                        {item.goesDeeper && (
                          <span className="ml-auto shrink-0">{">>>"}</span>
                        )}
                        {pathname ===
                          item.href({
                            teamId: params.teamId as string | undefined,
                          }) && (
                          <span className="ml-auto shrink-0 text-accent">
                            {"*"}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </motion.nav>
      </AnimatePresence>
    </LazyMotion>
  );
}
