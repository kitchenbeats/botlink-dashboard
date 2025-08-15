'use client'

import { UsageData } from '@/server/usage/types'
import LineChart from '@/ui/data/line-chart'
import { useMemo } from 'react'

export function CostChart({ data }: { data: UsageData['compute'] }) {
  const chartData = useMemo(() => {
    return [
      {
        id: 'cost',
        data: data.map((item) => ({
          x: new Date(item.year, item.month - 1),
          y: item.total_cost,
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
