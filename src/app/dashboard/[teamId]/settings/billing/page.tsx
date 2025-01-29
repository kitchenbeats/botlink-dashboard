import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { TIERS } from "@/configs/tiers";
import BillingTierCard from "@/features/dashboard/billing/tier-card";
import BillingCreditsContent from "@/features/dashboard/billing/credits-content";
import { Suspense } from "react";
import CustomerPortalLink from "@/features/dashboard/billing/customer-portal-link";
import DashboardPageLayout from "@/features/dashboard/page-layout";
import BillingInvoicesTable from "@/features/dashboard/billing/invoices-table";
import { Loader } from "@/ui/loader";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <DashboardPageLayout title="Billing">
      <div className="grid grid-cols-12 gap-6">
        <Card className="relative col-span-8">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              Manage your current plan and subscription details.
            </CardDescription>
            <Suspense fallback={null}>
              <CustomerPortalLink />
            </Suspense>
          </CardHeader>
          <CardContent className="flex gap-8 pt-6">
            {TIERS.map((tier) => (
              <BillingTierCard
                key={tier.id}
                tier={tier}
                isHighlighted={tier.id === "pro_v1"}
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
            <Suspense
              fallback={<Loader className="text-2xl" variant="square" />}
            >
              <BillingCreditsContent teamId={teamId} />
            </Suspense>
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
            <BillingInvoicesTable teamId={teamId} />
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
