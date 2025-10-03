/**
 * Custom hooks for line chart functionality
 */

import { formatNumber } from '@/lib/utils/formatting'
import { ECharts } from 'echarts'
import { useCallback, useEffect, useRef } from 'react'
import type { DataZoomEvent, LineSeries, UpdateAxisPointerEvent } from './types'

/**
 * Hook to find y-value for given x-value using binary search
 */
export function useYValueFinder(data: LineSeries[]) {
  return useCallback(
    (xValue: number): number | null => {
      if (!data || data.length === 0) return null

      // search in first data series
      const series = data[0]
      if (!series?.data) return null

      // binary search for efficiency (assuming sorted data)
      let left = 0
      let right = series.data.length - 1
      let closestIdx = 0
      let minDiff = Infinity

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const point = series.data[mid]
        if (!point) continue

        const pointX =
          point.x instanceof Date
            ? point.x.getTime()
            : typeof point.x === 'number'
              ? point.x
              : parseFloat(String(point.x))

        if (isNaN(pointX)) continue

        const diff = Math.abs(pointX - xValue)

        if (diff < minDiff) {
          minDiff = diff
          closestIdx = mid
        }

        if (pointX < xValue) {
          left = mid + 1
        } else if (pointX > xValue) {
          right = mid - 1
        } else {
          // exact match
          return point.y
        }
      }

      return series.data[closestIdx]?.y ?? null
    },
    [data]
  )
}

/**
 * Hook to manage chart instance and setup event handlers
 */
export function useChartInstance(
  onChartReady?: (chart: ECharts) => void,
  group?: string
) {
  const chartInstanceRef = useRef<ECharts | null>(null)

  const handleChartReady = useCallback(
    (chart: ECharts) => {
      chartInstanceRef.current = chart

      // activate datazoom
      chart.dispatchAction(
        {
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: true,
        },
        {
          flush: true,
        }
      )

      // set the group if provided for chart connection
      if (group) {
        chart.group = group
      }

      // call the external callback if provided
      if (onChartReady) {
        onChartReady(chart)
      }
    },
    [group, onChartReady]
  )

  return {
    chartInstanceRef,
    handleChartReady,
  }
}

/**
 * Hook to synchronize y-axis pointer with x-axis pointer position
 */
export function useAxisPointerSync(
  chart: ECharts | null,
  findYValueAtX: (xValue: number) => number | null,
  enabled: boolean
) {
  useEffect(() => {
    if (!chart || !enabled) return

    const handleUpdateAxisPointer = (event: unknown) => {
      const axisEvent = event as UpdateAxisPointerEvent

      // look for x-axis info
      if (axisEvent.axesInfo && axisEvent.axesInfo.length > 0) {
        const xAxisInfo = axisEvent.axesInfo.find(
          (info) => info.axisDim === 'x'
        )

        if (xAxisInfo && typeof xAxisInfo.value !== 'undefined') {
          // find the corresponding y-value at this x position
          const yValue = findYValueAtX(xAxisInfo.value)

          if (yValue !== null) {
            // update y-axis pointer to match x-axis data point
            chart.setOption(
              {
                yAxis: {
                  axisPointer: {
                    value: yValue,
                    label: {
                      formatter: formatNumber(yValue).toString(),
                    },
                  },
                },
              },
              {
                lazyUpdate: true,
                silent: true,
              }
            )
          }
        }
      }
    }

    chart.on('updateAxisPointer', handleUpdateAxisPointer)

    return () => {
      chart.off('updateAxisPointer', handleUpdateAxisPointer)
    }
  }, [chart, findYValueAtX, enabled])
}

/**
 * Hook to handle chart zoom events
 */
export function useChartZoom(onZoomEnd?: (from: number, to: number) => void) {
  return useCallback(
    (params: DataZoomEvent) => {
      if (onZoomEnd && params.batch && params.batch[0]) {
        const { startValue, endValue } = params.batch[0]

        if (startValue !== undefined && endValue !== undefined) {
          onZoomEnd(Math.round(startValue), Math.round(endValue))
        }
      }
    },
    [onZoomEnd]
  )
}
