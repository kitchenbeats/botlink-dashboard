import { getBillingLimits } from '@/server/billing/get-billing-limits'
import LimitCard from './limit-card'
import AlertCard from './alert-card'
import { cn } from '@/lib/utils'
import Dotted from '@/ui/dotted'
import { ErrorIndicator } from '@/ui/error-indicator'

interface UsageLimitsProps {
  className?: string
  teamId: string
}

export default async function UsageLimits({
  className,
  teamId,
}: UsageLimitsProps) {
  const res = await getBillingLimits({ teamId })

  if (res.type === 'error') {
    return (
      <div className="p-4">
        <ErrorIndicator
          description={'Could not load usage limits'}
          message={res.message}
          className="w-full max-w-full bg-bg"
        />
      </div>
    )
  }

  const limits = res.data

  return (
    <div className={cn('relative flex flex-col border-t pt-1', className)}>
      <Dotted className="-z-10" />
      <div className="flex flex-col border-t bg-bg lg:flex-row">
        <LimitCard
          value={limits.limit_amount_gte}
          className="flex-1 border-r"
        />
        <AlertCard value={limits.alert_amount_gte} className="flex-1" />
      </div>
    </div>
  )
}
