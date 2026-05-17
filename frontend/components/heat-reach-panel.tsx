'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { MomentumSignal, StateHeatCell } from '@/lib/india-states'
import { buildFallbackStateHeatmap } from '@/lib/state-heatmap-fallback'
import { IndiaTrendMap } from './india-trend-map'
import { IndiaReachPie } from './india-reach-pie'

interface HeatReachPanelProps {
  heatScore: number
  indiaReachPct?: number
  momentum?: MomentumSignal
  stateHeatmap?: StateHeatCell[]
  compact?: boolean
}

/** Compact India map heat + optional population reach pie. */
export function HeatReachPanel({
  heatScore,
  indiaReachPct,
  momentum = 'stable',
  stateHeatmap,
  compact = false,
}: HeatReachPanelProps) {
  const cells = useMemo(() => {
    if (stateHeatmap && stateHeatmap.length > 0) return stateHeatmap
    return buildFallbackStateHeatmap(heatScore, momentum)
  }, [stateHeatmap, heatScore, momentum])

  return (
    <div className={cn('flex gap-2', compact ? 'items-center' : 'items-start')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs text-muted-foreground">India heat</span>
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {heatScore}/100
          </span>
        </div>
        <IndiaTrendMap stateHeatmap={cells} momentum={momentum} compact={compact} />
      </div>
      {indiaReachPct != null && indiaReachPct > 0 && (
        <div className="flex flex-col items-center shrink-0 self-center">
          <IndiaReachPie percent={indiaReachPct} size={compact ? 40 : 56} />
          {!compact && (
            <p className="text-[9px] text-muted-foreground text-center mt-0.5 max-w-[52px] leading-tight">
              India reach
            </p>
          )}
        </div>
      )}
    </div>
  )
}
