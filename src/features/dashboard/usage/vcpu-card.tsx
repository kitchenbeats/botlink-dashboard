import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/ui/primitives/card'
import { VCPUChart } from './vcpu-chart'
import { TransformedUsageData } from '@/server/usage/types'

export function VCPUCard({
  data,
  className,
}: {
  data: TransformedUsageData
  className?: string
}) {
  const latestVCPU = data.vcpuSeries[0].data.at(-1)?.y

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">vCPU Hours</CardTitle>
        <CardDescription>
          Virtual CPU time consumed by your sandboxes
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl">
            {latestVCPU?.toFixed(2) ?? '0.00'}
          </p>
          <span className="text-fg-500 text-xs">hours used</span>
        </div>
        <VCPUChart data={data.vcpuSeries[0].data} />
      </CardContent>
    </Card>
  )
}
