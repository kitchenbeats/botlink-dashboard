"use client";

import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { Button } from "@/ui/primitives/button";
import Link from "next/link";

interface CustomerPortalLinkProps {
  className?: string;
}

export default function CustomerPortalLink({
  className,
}: CustomerPortalLinkProps) {
  const team = useSelectedTeam();

  if (!team) return null;

  return (
    <Button asChild variant="muted" className={className}>
      <Link
        href={`${process.env.NEXT_PUBLIC_STRIPE_BILLING_URL}?prefilled_email=${team?.email}`}
      >
        Customer Portal
        {" >>>"}
      </Link>
    </Button>
  );
}
