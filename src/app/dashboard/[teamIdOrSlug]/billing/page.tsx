import { CardDescription, CardTitle } from '@/ui/primitives/card'
import { TIERS } from '@/configs/tiers'
import BillingTierCard from '@/features/dashboard/billing/tier-card'
import { Suspense } from 'react'
import CustomerPortalLink from '@/features/dashboard/billing/customer-portal-link'
import DashboardPageLayout from '@/features/dashboard/page-layout'
import BillingInvoicesTable from '@/features/dashboard/billing/invoices-table'
import { resolveTeamIdInServerComponent } from '@/lib/utils/server'

export default async function BillingPage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  const { teamIdOrSlug } = await params
  const teamId = await resolveTeamIdInServerComponent(teamIdOrSlug)

  return (
    <DashboardPageLayout
      title="Billing"
      className="grid w-full gap-4 p-4 sm:gap-6 sm:p-6"
    >
      {/* Plan Section */}
      <section className="col-span-1 grid gap-4 xl:col-span-12">
        <div className="flex flex-col gap-1">
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            Manage your current plan and subscription details.
          </CardDescription>
        </div>

        <Suspense fallback={null}>
          <CustomerPortalLink className="mt-2 w-fit shadow-md" />
        </Suspense>

        <div className="mt-3 flex flex-col gap-12 overflow-x-auto max-lg:mb-6 lg:flex-row">
          {TIERS.map((tier) => (
            <BillingTierCard
              key={tier.id}
              tier={tier}
              isHighlighted={tier.id === 'pro_v1'}
              className="min-w-[280px] shadow-xl lg:w-1/2 xl:min-w-0"
            />
          ))}
        </div>
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
    </DashboardPageLayout>
  )
}
