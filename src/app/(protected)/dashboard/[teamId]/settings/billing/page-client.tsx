"use client";

import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import BillingInvoicesTable from "@/features/dashboard/billing/invoices-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { TIERS } from "@/configs/tiers";
import BillingTierCard from "@/features/dashboard/billing/tier-card";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { Button } from "@/ui/primitives/button";
import Link from "next/link";
import BillingCreditsContent from "@/features/dashboard/billing/credits-content";

export default function BillingPageClient() {
  const team = useSelectedTeam();

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-8">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            Manage your current plan and subscription details.
          </CardDescription>
          <Button asChild variant="muted" className="absolute right-6 top-4">
            <Link
              href={`${process.env.NEXT_PUBLIC_STRIPE_BILLING_URL}?prefilled_email=${team?.email}`}
            >
              Customer Portal
              {" >>>"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex gap-8 pt-6">
          {TIERS.map((tier) => (
            <BillingTierCard
              key={tier.id}
              tier={tier}
              isHighlighted={tier.id === "pro_v1"}
              isSelected={!team ? undefined : team?.tier === tier.id}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="col-span-4 h-min">
        <CardHeader>
          <CardTitle>Credits</CardTitle>
          <CardDescription>
            Your current credits balance. Your usage costs are deducted from
            your credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingCreditsContent />
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your team's billing history and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingInvoicesTable />
        </CardContent>
      </Card>
    </div>
  );
}
