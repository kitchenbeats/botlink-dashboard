"use client";

import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { Button } from "@/ui/primitives/button";
import Link from "next/link";

export default function CustomerPortalLink() {
  const team = useSelectedTeam();

  if (!team) return null;

  return (
    <Button asChild variant="muted" className="absolute right-6 top-4">
      <Link
        href={`${process.env.NEXT_PUBLIC_STRIPE_BILLING_URL}?prefilled_email=${team?.email}`}
      >
        Customer Portal
        {" >>>"}
      </Link>
    </Button>
  );
}
