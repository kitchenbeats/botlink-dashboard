import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/ui/primitives/card'
import { RAMChart } from './ram-chart'
import { TransformedUsageData } from '@/server/usage/types'

export function RAMCard({
  data,
  className,
}: {
  data: TransformedUsageData
  className?: string
}) {
  const latestRAM = data.ramSeries[0].data.at(-1)?.y

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">RAM Hours</CardTitle>
        <CardDescription>
          Memory usage duration across all sandboxes
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl">
            {latestRAM?.toFixed(2) ?? '0.00'}
          </p>
          <span className="text-fg-500 text-xs">GB-hours used</span>
        </div>
        <RAMChart data={data.ramSeries[0].data} />
      </CardContent>
    </Card>
  )
}
