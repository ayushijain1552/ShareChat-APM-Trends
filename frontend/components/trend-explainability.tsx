'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Globe2,
  MapPin,
  Minus,
  Newspaper,
  Radio,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MomentumDirection, Trend } from '@/lib/mock-data'
import {
  buildSourceShareRows,
  freshnessTierStyles,
  resolveExplainability,
} from '@/lib/trend-explainability'

interface TrendExplainabilityPanelProps {
  trend: Trend
}

function DirectionIcon({ direction }: { direction: MomentumDirection }) {
  if (direction === 'rising') {
    return <ArrowUp className="w-3.5 h-3.5 text-chart-4" />
  }
  if (direction === 'falling') {
    return <ArrowDown className="w-3.5 h-3.5 text-destructive" />
  }
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />
}

function momentumLabel(direction: MomentumDirection): string {
  if (direction === 'rising') return 'Rising'
  if (direction === 'falling') return 'Falling'
  return 'Stable'
}

export function TrendExplainabilityPanel({ trend }: TrendExplainabilityPanelProps) {
  const exp = resolveExplainability(trend)
  const freshStyles = freshnessTierStyles(exp.freshnessTier)
  const breakdown = trend.sourceBreakdown
  const sourceRows =
    breakdown != null ? buildSourceShareRows(breakdown, exp.rssSourceNames) : []

  const overallMomentum = trend.momentum
  const OverallIcon =
    overallMomentum === 'rising'
      ? TrendingUp
      : overallMomentum === 'falling'
        ? TrendingDown
        : Activity

  return (
    <div className="space-y-4 mb-5">
      <div className={cn('card-sharechat p-4 ring-1', freshStyles.ring)}>
        <motion.div layout className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">Freshness</h3>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              freshStyles.badge,
            )}
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', freshStyles.dot)} />
            <span lang="hi">{exp.freshnessLabelHi}</span>
          </span>
        </motion.div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{exp.freshnessLabelEn}</span>
          <span className="font-medium text-foreground tabular-nums">{trend.freshness}</span>
        </div>
        {trend.lastUpdated ? (
          <p className="text-xs text-muted-foreground mt-2">
            Pipeline: {new Date(trend.lastUpdated).toLocaleString('en-IN')}
          </p>
        ) : null}
      </div>

      <div className="card-sharechat p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-chart-4" />
          <h3 className="text-sm font-medium text-muted-foreground">Why it&apos;s rising</h3>
        </div>
        <p className="text-foreground leading-relaxed text-sm" lang="hi">
          {exp.whyRising}
        </p>
      </div>

      <div className="card-sharechat p-4">
        <div className="flex items-center justify-between mb-3">
          <motion.div layout className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">Momentum by source</h3>
          </motion.div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <OverallIcon
              className={cn(
                'w-4 h-4',
                overallMomentum === 'rising'
                  ? 'text-chart-4'
                  : overallMomentum === 'falling'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
              )}
            />
            {momentumLabel(overallMomentum)}
          </div>
        </div>
        <div className="space-y-3">
          {exp.momentumChannels.map((ch, i) => (
            <div key={ch.key}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <DirectionIcon direction={ch.direction} />
                  <span className="text-sm font-medium text-foreground truncate" lang="hi">
                    {ch.labelHi}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {Math.round(ch.strength)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ch.strength}%` }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.45, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    ch.direction === 'rising'
                      ? 'bg-chart-4'
                      : ch.direction === 'falling'
                        ? 'bg-destructive/80'
                        : 'bg-primary/70',
                  )}
                />
              </div>
              {ch.detailHi ? (
                <p className="text-[11px] text-muted-foreground mt-0.5 pl-5" lang="hi">
                  {ch.detailHi}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="card-sharechat p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground">Local relevance (India)</h3>
        </div>
        {trend.indiaReachPct != null && trend.indiaReachPct > 0 ? (
          <div className="flex items-baseline gap-2 mb-2">
            <Globe2 className="w-5 h-5 text-primary shrink-0" />
            <span className="text-2xl font-bold text-primary tabular-nums">
              {trend.indiaReachPct.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">estimated population reach</span>
          </div>
        ) : null}
        <p className="text-sm text-foreground leading-relaxed" lang="hi">
          {exp.localRelevance}
        </p>
      </div>

      {sourceRows.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Source breakdown</h3>
          </div>
          <div className="space-y-2">
            {sourceRows.map((row, i) => (
              <div key={row.key} className="card-sharechat p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                        row.color,
                      )}
                    >
                      {row.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{row.metricLabel}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                    {row.sharePct}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.sharePct}%` }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                    className={cn('h-full rounded-full', row.color)}
                  />
                </div>
              </div>
            ))}
          </div>
          {exp.rssSourceNames.length > 1 ? (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              News feeds: {exp.rssSourceNames.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
