import { GithubIcon } from "lucide-react";
import { Logo } from "../globals/logo";
import { Button } from "../ui/button";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 h-[var(--fd-nav-height)] w-full border-b border-border bg-bg/70 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between p-3 px-5 text-sm">
        <a href={"/"}>
          <Logo className="h-10 w-20" />
        </a>
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
