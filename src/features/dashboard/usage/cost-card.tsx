import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/ui/primitives/card'
import { CostChart } from './cost-chart'
import { TransformedUsageData } from '@/server/usage/types'

export function CostCard({
  data,
  className,
}: {
  data: TransformedUsageData
  className?: string
}) {
  const latestCost = data.costSeries[0].data.at(-1)?.y

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">Usage Costs</CardTitle>
        <CardDescription>
          Total cost of all resources for the current billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl">
            ${latestCost?.toFixed(2) ?? '0.00'}
          </p>
          <span className="text-fg-500 text-xs">this period</span>
        </div>
        <CostChart data={data.costSeries[0].data} />
      </CardContent>
    </Card>
  )
}
