import { PatternLinesDef, patternLinesDef } from '@nivo/core'

export const SCANLINE_PATTERN: ({
  color,
}: {
  color: string
}) => PatternLinesDef = ({ color }) =>
  patternLinesDef('scanline-pattern', {
    spacing: 6,
    rotation: -45,
    lineWidth: 2,
    background: 'transparent',
    color,
  })
