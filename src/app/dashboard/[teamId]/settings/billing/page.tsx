import { CardDescription, CardTitle } from "@/ui/primitives/card";
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
      <div className="grid w-full gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-8">
          {/* Plan Section */}
          <section className="col-span-1 grid gap-4 xl:col-span-8">
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Plan</CardTitle>
                <CardDescription>
                  Manage your current plan and subscription details.
                </CardDescription>
              </div>
              <Suspense fallback={null}>
                <CustomerPortalLink />
              </Suspense>
            </div>

            <div className="mt-3 flex flex-col gap-12 overflow-x-auto max-lg:mb-6 lg:flex-row">
              {TIERS.map((tier) => (
                <BillingTierCard
                  key={tier.id}
                  tier={tier}
                  isHighlighted={tier.id === "pro_v1"}
                  className="min-w-[280px] xl:min-w-0"
                />
              ))}
            </div>
          </section>

          {/* Credits Section */}
          <section className="col-span-1 flex flex-col gap-4 xl:col-span-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Credits</CardTitle>
              <CardDescription>
                Your current credits balance. Your usage costs are deducted from
                your credits.
              </CardDescription>
            </div>

            <Suspense
              fallback={<Loader className="text-2xl" variant="square" />}
            >
              <BillingCreditsContent teamId={teamId} />
            </Suspense>
          </section>

          {/* Billing History Section */}
          <section className="col-span-1 mt-8 grid gap-4 xl:col-span-12">
            <div className="flex flex-col gap-1">
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your team's billing history and invoices.
              </CardDescription>
            </div>

            <div className="w-full overflow-x-auto">
              <BillingInvoicesTable teamId={teamId} />
            </div>
          </section>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
