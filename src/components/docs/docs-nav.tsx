import { GithubIcon } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import LogoWithoutText from "../globals/logo-without-text";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 h-[var(--fd-nav-height)] w-full bg-bg/70 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between p-3 px-4 text-sm">
        <Link href={"/"}>
          <LogoWithoutText className="h-12 w-12" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="muted" size="iconSm">
            <GithubIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
