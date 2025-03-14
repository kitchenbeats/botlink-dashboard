import { getUsage } from '@/server/usage/get-usage'
import { ErrorIndicator } from '@/ui/error-indicator'

export default async function BillingCreditsContent({
  teamId,
}: {
  teamId: string
}) {
  const res = await getUsage({ teamId })

  if (res.type === 'error') {
    return (
      <div className="p-4 pb-0">
        <ErrorIndicator
          description={'Could not load credits'}
          message={res.message}
          className="bg-bg w-full max-w-full"
        />
      </div>
    )
  }

  const usage = res.data

  return (
    <span className="ml-2 text-2xl font-bold">
      <span className="text-accent text-sm font-normal">$ </span>
      {usage.credits.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        useGrouping: true,
      })}
    </span>
  )
}
