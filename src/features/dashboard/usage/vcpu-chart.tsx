'use client'

import { UsageData } from '@/server/usage/types'
import LineChart from '@/ui/data/line-chart'
import { useMemo } from 'react'

export function VCPUChart({ data }: { data: UsageData['compute'] }) {
  const chartData = useMemo(() => {
    return [
      {
        id: 'vcpu',
        data: data.map((item) => ({
          x: new Date(item.year, item.month - 1), // Convert to Date object
          y: item.vcpu_hours,
        })),
      },
    ]
  }, [data])

  const minimumVisualRangeMs = 6 * 30 * 24 * 60 * 60 * 1000 // ~6 months

  return (
    <div className="aspect-auto h-48">
      <LineChart
        data={chartData}
        minimumVisualRangeMs={minimumVisualRangeMs}
        curve="step"
      />
    </div>
  )
}
