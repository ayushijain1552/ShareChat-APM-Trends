'use client'

import { cn } from '@/lib/utils'
import type { TrendScoreFactors } from '@/lib/mock-data'

interface TrendScorePanelProps {
  factors: TrendScoreFactors
  compact?: boolean
}

function formatTag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`
}

function fmtScore(n: number): string {
  if (n >= 100) return n.toFixed(0)
  return n.toFixed(1)
}

export function TrendScorePanel({ factors, compact = false }: TrendScorePanelProps) {
  const tags = factors.coOccurrentTags ?? []
  const { trendScore } = factors

  return (
    <div className={cn('min-w-0', compact ? 'space-y-1.5' : 'space-y-2')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('font-medium text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          TrendScore
        </span>
        <span
          className={cn(
            'font-bold text-primary tabular-nums',
            compact ? 'text-lg' : 'text-2xl',
          )}
        >
          {fmtScore(trendScore)}
        </span>
      </div>

      {tags.length > 0 ? (
        <div className={cn('space-y-1', compact && 'max-h-14 overflow-hidden')}>
          {!compact && (
            <p className="text-[10px] text-muted-foreground">Co-occurrent tags</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                lang="hi"
                className={cn(
                  'rounded-full bg-muted text-foreground font-medium border border-border',
                  compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
                )}
              >
                {formatTag(tag)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        !compact && (
          <p className="text-[10px] text-muted-foreground">No co-occurrent tags yet</p>
        )
      )}
    </div>
  )
}
