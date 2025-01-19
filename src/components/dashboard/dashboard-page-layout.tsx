import { Suspense } from "react";
import AsciiTextDecrypt from "../globals/ascii-text-decrypt";
import GridPattern from "../ui/grid-pattern";
import UserMenu from "../auth/user-menu";
import { ThemeSwitcher } from "../globals/theme-switcher";

export default function DashboardPageLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-svh flex-col">
      <div className="flex h-[var(--protected-nav-height)] items-center gap-2 border-b px-3">
        <AsciiTextDecrypt
          title={title}
          interval={7}
          obscureCharacter="X"
          className="mr-auto text-lg"
        />
        {/*         {description && (
          <motion.p
            initial={{ opacity: 0, x: 5, y: 5 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              x: { delay: 0.3 },
              duration: 0.2,
              ease: exponentialSmoothing(4),
            }}
            className="ml-3 text-sm text-fg-500"
          >
            {description}
          </motion.p>
        )} */}

        <ThemeSwitcher />
        <Suspense fallback={<></>}>
          <UserMenu />
        </Suspense>
      </div>
      <div className="relative flex-1 overflow-y-auto scrollbar">
        {children}
      </div>
    </div>
  );
}
