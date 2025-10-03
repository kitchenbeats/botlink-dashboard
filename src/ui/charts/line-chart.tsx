'use client'

import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMemo, useRef } from 'react'

import * as echarts from 'echarts'

import { useCssVars } from '@/lib/hooks/use-css-vars'
import { TOOLTIP_TRANSITION_DURATION } from './constants'
import {
  createAxisPointerFormatter,
  createDefaultTooltipFormatter,
  createSplitLineInterval,
  createXAxisFormatter,
  createYAxisFormatter,
} from './formatters'
import {
  useAxisPointerSync,
  useChartInstance,
  useChartZoom,
  useYValueFinder,
} from './hooks'
import { defaultLineChartOption } from './options'
import { buildSeriesWithEnhancements } from './series'
import type { LineChartProps } from './types'
import { calculateYAxisMax, mergeReplaceArrays } from './utils'

const VARS = [
  '--stroke',
  '--stroke-active',
  '--fg',
  '--fg-secondary',
  '--fg-tertiary',
  '--bg-1',
  '--bg-hover',
  '--bg-highlight',
  '--bg-inverted',
  '--font-mono',
  '--accent-error-highlight',
  '--accent-error-bg',
  '--accent-warning-highlight',
  '--accent-warning-bg',
  '--accent-positive-highlight',
] as const

export default function LineChart({
  data,
  option: userOption,
  onZoomEnd,
  yAxisLimit,
  className,
  style,
  onChartReady,
  group,
  syncAxisPointers = false,
  showTooltip = false,
  tooltipFormatter,
}: LineChartProps) {
  const ref = useRef<ReactECharts | null>(null)
  const { resolvedTheme } = useTheme()
  const cssVars = useCssVars(VARS)

  // chart instance management
  const { chartInstanceRef, handleChartReady } = useChartInstance(
    onChartReady,
    group
  )

  // y-value finder for axis pointer syncing
  const findYValueAtX = useYValueFinder(data)

  // axis pointer syncing
  useAxisPointerSync(chartInstanceRef.current, findYValueAtX, syncAxisPointers)

  // zoom event handler
  const handleZoom = useChartZoom(onZoomEnd)

  // build chart options
  const option = useMemo<EChartsOption>(() => {
    // determine x-axis type from user options
    const xAxisType = userOption?.xAxis
      ? (userOption.xAxis as { type?: string }).type
      : 'category'

    // build tooltip configuration
    const tooltipConfig: EChartsOption['tooltip'] = showTooltip
      ? {
          show: true,
          trigger: 'axis' as const,
          triggerOn: 'mousemove|click' as const,
          confine: true,
          transitionDuration: TOOLTIP_TRANSITION_DURATION,
          enterable: false,
          hideDelay: 0,
          backgroundColor: 'transparent',
          padding: 0,
          borderWidth: 0,
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowColor: 'transparent',
          textStyle: {
            color: cssVars['--fg'],
          },
          formatter: tooltipFormatter || createDefaultTooltipFormatter(),
        }
      : {
          backgroundColor: 'transparent',
          padding: 0,
          borderWidth: 0,
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowColor: 'transparent',
          trigger: 'axis' as const,
          showDelay: 0,
        }

    // build themed defaults
    const themedDefaults = mergeReplaceArrays(defaultLineChartOption, {
      tooltip: tooltipConfig,
      xAxis: {
        axisLine: { lineStyle: { color: cssVars['--stroke'] } },
        axisLabel: {
          show: true,
          color: cssVars['--fg-tertiary'],
          fontFamily: cssVars['--font-mono'],
          fontSize: 14,
          hideOverlap: true,
          rotate: 0,
          interval: 'preserveStart',
          formatter: createXAxisFormatter(xAxisType),
        },
        axisPointer: {
          lineStyle: {
            color: cssVars['--bg-inverted'],
            type: 'dashed',
          },
          label: {
            backgroundColor: cssVars['--bg-highlight'],
            color: cssVars['--fg'],
            fontFamily: cssVars['--font-mono'],
            borderRadius: 0,
            fontSize: 14,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: createAxisPointerFormatter(xAxisType) as any,
          },
          snap: true,
        },
        splitLine: {
          lineStyle: { color: cssVars['--stroke'] },
        },
        splitNumber: 2,
      },
      yAxis: {
        axisLine: { lineStyle: { color: cssVars['--stroke'] } },
        axisLabel: {
          show: true,
          color: cssVars['--fg-tertiary'],
          fontFamily: cssVars['--font-mono'],
          fontSize: 14,
          formatter: createYAxisFormatter(yAxisLimit),
          overflow: 'truncate' as const,
          ellipsis: '…',
          width: 40,
        },
        axisPointer: {
          show: false,
          lineStyle: {
            color: cssVars['--bg-inverted'],
            type: 'dashed',
          },
          label: {
            backgroundColor: cssVars['--bg-highlight'],
            color: cssVars['--fg'],
            fontFamily: cssVars['--font-mono'],
            position: 'top',
            borderRadius: 0,
            fontSize: 14,
          },
          snap: !syncAxisPointers, // disable snap when syncing
        },
        splitLine: {
          lineStyle: { color: cssVars['--stroke'], type: 'dashed' },
          interval: createSplitLineInterval(yAxisLimit),
        },
        splitNumber: 2,
      },
      toolbox: {
        feature: {
          dataZoom: {
            brushStyle: {
              borderWidth: 1,
              color: resolvedTheme === 'dark' ? '#f2f2f244' : '#1f1f1f44',
              borderColor: cssVars['--bg-inverted'],
              opacity: 0.6,
            },
          },
        },
      },
    })

    return userOption
      ? mergeReplaceArrays(themedDefaults, userOption)
      : themedDefaults
  }, [
    cssVars,
    userOption,
    yAxisLimit,
    resolvedTheme,
    syncAxisPointers,
    showTooltip,
    tooltipFormatter,
  ])

  const optionsWithData = useMemo(() => {
    if (!data || data.length === 0) {
      return option
    }

    const series = buildSeriesWithEnhancements(
      data,
      cssVars,
      showTooltip,
      yAxisLimit
    )

    const max = calculateYAxisMax(data, yAxisLimit)

    return {
      ...option,
      series,
      yAxis: {
        ...option.yAxis,
        max,
      },
    }
  }, [option, data, cssVars, showTooltip, yAxisLimit])

  return (
    <ReactECharts
      ref={ref}
      key={resolvedTheme}
      echarts={echarts}
      option={optionsWithData}
      notMerge={true}
      lazyUpdate={true}
      style={{ width: '100%', height: '100%', ...style }}
      onChartReady={handleChartReady}
      className={className}
      onEvents={{
        datazoom: handleZoom,
      }}
    />
  )
}
