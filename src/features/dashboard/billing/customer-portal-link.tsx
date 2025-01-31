"use client";

import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { Button } from "@/ui/primitives/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CgArrowTopRight } from "react-icons/cg";

interface CustomerPortalLinkProps {
  className?: string;
}

export default function CustomerPortalLink({
  className,
}: CustomerPortalLinkProps) {
  const team = useSelectedTeam();

  if (!team) return null;

  return (
    <Button asChild variant="outline" className={className}>
      <Link
        href={`${process.env.NEXT_PUBLIC_STRIPE_BILLING_URL}?prefilled_email=${team?.email}`}
      >
        Subscription Management
        <ChevronRight className="text-accent size-4 -translate-y-1 translate-x-1 -rotate-45" />
      </Link>
    </Button>
  );
}
