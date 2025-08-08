'use client'

import { PartialTheme } from '@nivo/theming'

export const nivoTheme: PartialTheme = {
  background: 'transparent',
  axis: {
    domain: {
      line: {
        stroke: 'var(--color-stroke)',
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fill: 'var(--color-fg)',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineOpacity: 1,
      },
    },
    ticks: {
      line: {
        stroke: 'var(--color-stroke)',
        strokeWidth: 1,
      },
      text: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fill: 'var(--color-fg-tertiary)',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineOpacity: 1,
      },
    },
  },
  grid: {
    line: {
      stroke: 'var(--color-stroke)',
      strokeWidth: 1,
      strokeOpacity: 0.5,
    },
  },
  legends: {
    hidden: {
      symbol: { opacity: 0.5 },
      text: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fill: 'var(--color-fg-tertiary)',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineOpacity: 1,
      },
    },
    title: {
      text: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fill: 'var(--color-fg)',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineOpacity: 1,
      },
    },
    text: {
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fill: 'var(--color-fg)',
      outlineWidth: 0,
      outlineColor: 'transparent',
      outlineOpacity: 1,
    },
    ticks: {
      line: {},
      text: {
        fontFamily: 'var(--font-sans)',
        fontSize: 10,
        fill: 'var(--color-fg)',
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineOpacity: 1,
      },
    },
  },
  annotations: {
    text: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fill: 'var(--color-fg)',
      outlineWidth: 2,
      outlineColor: 'var(--color-bg)',
      outlineOpacity: 1,
    },
    link: {
      stroke: 'var(--color-stroke)',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: 'var(--color-bg)',
      outlineOpacity: 1,
    },
    outline: {
      stroke: 'var(--color-stroke)',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: 'var(--color-bg)',
      outlineOpacity: 1,
    },
    symbol: {
      fill: 'var(--color-stroke)',
      outlineWidth: 2,
      outlineColor: 'var(--color-bg)',
      outlineOpacity: 1,
    },
  },
  tooltip: {
    container: {
      background: 'var(--color-bg-1)',
      color: 'var(--color-fg)',
      fontSize: 12,
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-stroke)',
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {},
  },
  crosshair: {
    line: {
      stroke: 'var(--color-accent-main-highlight)',
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeDasharray: 'none',
    },
  },
}
