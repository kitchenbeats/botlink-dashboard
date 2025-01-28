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
import ClientOnly from "@/ui/client-only";
import DashboardPageLayout from "@/features/dashboard/layout/page-layout";
import BillingInvoicesTable from "@/features/dashboard/billing/invoices-table";

export const experimental_ppr = true;

export default async function BillingPage() {
  "use cache";

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
          <Suspense fallback={null}>
            <ClientOnly>
              <CardContent className="flex gap-8 pt-6">
                {TIERS.map((tier) => (
                  <BillingTierCard
                    key={tier.id}
                    tier={tier}
                    isHighlighted={tier.id === "pro_v1"}
                  />
                ))}
              </CardContent>
            </ClientOnly>
          </Suspense>
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
            <Suspense fallback={null}>
              <BillingCreditsContent />
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
            <Suspense fallback={null}>
              <BillingInvoicesTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
