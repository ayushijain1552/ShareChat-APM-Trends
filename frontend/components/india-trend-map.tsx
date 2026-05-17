'use client'

import { useId, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  INDIA_OUTLINE,
  cellFill,
  centroidForCode,
  dominantGradientStops,
  type MomentumSignal,
  type StateHeatCell,
} from '@/lib/india-states'

interface IndiaTrendMapProps {
  stateHeatmap: StateHeatCell[]
  momentum?: MomentumSignal
  compact?: boolean
  className?: string
}

export function IndiaTrendMap({
  stateHeatmap,
  momentum = 'stable',
  compact = false,
  className,
}: IndiaTrendMapProps) {
  const gradId = useId().replace(/:/g, '')
  const { inner, outer } = dominantGradientStops(momentum)

  const dots = useMemo(() => {
    return stateHeatmap
      .filter((c) => c.intensity >= 0.12)
      .map((cell) => {
        const pos = centroidForCode(cell.code)
        if (!pos) return null
        const r = compact
          ? 1.2 + cell.intensity * 2.2
          : 1.6 + cell.intensity * 3.2
        return {
          ...cell,
          ...pos,
          r,
          fill: cellFill(cell.signal, cell.intensity),
        }
      })
      .filter(Boolean) as Array<
      StateHeatCell & { x: number; y: number; r: number; fill: string }
    >
  }, [stateHeatmap, compact])

  const w = compact ? 72 : 100
  const h = compact ? 80 : 110

  return (
    <div className={cn('flex flex-col', className)}>
      <svg
        viewBox="0 0 100 110"
        width={w}
        height={h}
        className="shrink-0"
        role="img"
        aria-label="India trend heat map"
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={inner} />
            <stop offset="100%" stopColor={outer} />
          </radialGradient>
        </defs>
        <path
          d={INDIA_OUTLINE}
          fill={`url(#${gradId})`}
          stroke="currentColor"
          strokeWidth={0.6}
          className="text-border"
        />
        {dots.map((d) => (
          <circle
            key={d.code}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={d.fill}
            className="transition-colors duration-300"
          >
            <title>{`${d.nameHi} — ${d.signal}`}</title>
          </circle>
        ))}
      </svg>
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground',
          compact ? 'mt-1' : 'mt-1.5',
        )}
      >
        <span className="inline-flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" aria-hidden />
          Rising
        </span>
        <span className="inline-flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#eab308]" aria-hidden />
          Stable
        </span>
        <span className="inline-flex items-center gap-0.5">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" aria-hidden />
          Declining
        </span>
      </div>
    </div>
  )
}
