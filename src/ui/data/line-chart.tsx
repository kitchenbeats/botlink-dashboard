'use client'

import {
  CommonLineProps,
  LineSeries,
  LineSvgProps,
  ResponsiveLine,
} from '@nivo/line'
import { BasicTooltip } from '@nivo/tooltip'
import * as React from 'react'
import { SCANLINE_PATTERN } from './pattern'
import { nivoTheme } from './theme'
import DefaultTooltip from './tooltips'

const tickFormatter = (value: any) => {
  return String(value)
}

interface LineChartProps extends Omit<CommonLineProps<LineSeries>, 'data'> {
  data: LineSeries[]
}

export default function LineChart({ data }: LineChartProps) {
  return (
    <div className="w-full h-full">
      <ResponsiveLine
        animate={true}
        enableTouchCrosshair={true}
        enableSlices="x"
        enableGridX={false}
        enableGridY={false}
        defs={[
          SCANLINE_PATTERN({ color: 'var(--color-accent-main-highlight)' }),
        ]}
        fill={[{ match: { id: 'usage' }, id: 'scanline-pattern' }]}
        data={data}
        key={'usage'}
        lineWidth={1}
        curve="step"
        colors={['var(--color-accent-main-highlight)']}
        enableCrosshair={true}
        isInteractive={true}
        crosshairType="cross"
        enableArea={true}
        enablePoints={false}
        theme={nivoTheme}
        axisLeft={{
          format: tickFormatter,
        }}
        axisBottom={{
          format: tickFormatter,
        }}
        margin={{ top: 5, right: 30, bottom: 25, left: 30 }}
        tooltip={({ point }) => (
          <BasicTooltip
            id={`${point.data.x}: ${point.data.y}`}
            enableChip={false}
            color={point.color}
          />
        )}
      />
    </div>
  )
}

// Time-anchored variant: right edge = now, domain min = now - minimumVisualRangeMs
export interface LineChartTSProps extends Partial<LineSvgProps<LineSeries>> {
  data: LineSeries[]
  minimumVisualRangeMs: number
}

export function LineChartTS({
  data,
  minimumVisualRangeMs,
  ...rest
}: LineChartTSProps) {
  const now = new Date()
  const minDate = new Date(now.getTime() - Math.max(0, minimumVisualRangeMs))

  const timeTickFormatter = React.useCallback((value: any) => {
    const d = value instanceof Date ? value : new Date(value)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
    })
  }, [])

  return (
    <div className="w-full h-full">
      <ResponsiveLine
        animate={true}
        enableSlices="x"
        yFormat={(value) =>
          `$${(value as number)?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        }
        xFormat={(value) =>
          (value as Date).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
          })
        }
        sliceTooltip={({ slice }) => (
          <DefaultTooltip
            title={
              <>
                Cost:{' '}
                <span className="text-accent-main-highlight">
                  {slice.points?.[0]?.data.yFormatted}
                </span>
              </>
            }
            subtitle={`${slice.points?.[0]?.data.xFormatted}`}
          ></DefaultTooltip>
        )}
        enableGridX={false}
        enableGridY={false}
        defs={[
          SCANLINE_PATTERN({ color: 'var(--color-accent-main-highlight)' }),
        ]}
        fill={[{ match: '*', id: 'scanline-pattern' }]}
        data={data}
        key={`ts-${minimumVisualRangeMs}`}
        lineWidth={1}
        colors={['var(--color-accent-main-highlight)']}
        isInteractive={true}
        enableArea={true}
        enablePoints={false}
        theme={nivoTheme}
        xScale={{
          type: 'time',
          format: 'native',
          useUTC: false,
          min: minDate,
          max: now,
        }}
        axisLeft={{
          format: (v: any) => String(v),
          tickValues: 4,
        }}
        axisBottom={{ format: timeTickFormatter }}
        margin={{ top: 5, right: 30, bottom: 25, left: 30 }}
        {...rest}
      />
    </div>
  )
}
