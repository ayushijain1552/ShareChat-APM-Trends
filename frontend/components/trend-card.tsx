'use client'

import { useState, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ChevronRight,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trend } from '@/lib/mock-data'
import { TrendSourceLinks } from './trend-source-links'
import { buildFallbackTrendScore } from '@/lib/trend-score'
import { TrendScorePanel } from './trend-score-panel'

interface TrendCardProps {
  trend: Trend
  index: number
  onSelect: (trend: Trend) => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function TrendCard({
  trend,
  index,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: TrendCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-5, 0, 5])
  const opacity = useTransform(x, [-200, 0, 200], [0.7, 1, 0.7])

  const getMomentumIcon = () => {
    switch (trend.momentum) {
      case 'rising':
        return <TrendingUp className="w-3.5 h-3.5 text-chart-4" />
      case 'falling':
        return <TrendingDown className="w-3.5 h-3.5 text-destructive" />
      default:
        return <Minus className="w-3.5 h-3.5 text-muted-foreground" />
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    if (Math.abs(info.offset.x) > 100) {
      // Swipe action placeholder
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={() => !isDragging && onSelect(trend)}
      className="touch-pan-y cursor-pointer"
    >
      <div className="card-sharechat transition-shadow duration-200">
        <motion.div layout className="p-3.5">
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Flame
                className={cn(
                  'w-4 h-4 shrink-0',
                  trend.heatScore >= 90 ? 'text-accent' : 'text-primary',
                )}
              />
              <span className="text-sm font-medium text-foreground" lang="hi">
                {trend.hindiHashtag}
              </span>
              <span className="flex items-center gap-0.5">{getMomentumIcon()}</span>
            </div>
            <button
              type="button"
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              className="p-1.5 -mr-1 rounded-full hover:bg-muted transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.()
              }}
            >
              <Heart
                className={cn(
                  'w-5 h-5',
                  isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-1.5">{trend.topic}</p>

          <p className="text-sm text-foreground mb-3 line-clamp-2 leading-relaxed" lang="hi">
            {trend.hindiSummary}
          </p>

          <motion.div layout className="mb-3 py-2 px-2 rounded-xl bg-muted/40">
            <TrendScorePanel
              factors={trend.trendScore ?? buildFallbackTrendScore(trend.heatScore)}
              compact
            />
          </motion.div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {trend.sources.slice(0, 3).map((source, i) => (
                <div
                  key={source.name}
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium',
                    source.color,
                    'border-2 border-card',
                    i !== 0 && '-ml-2',
                  )}
                  style={{ zIndex: 3 - i }}
                >
                  {source.icon}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-1 truncate">
                {trend.engagement.views} views
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{trend.freshness}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <TrendSourceLinks
            newsArticleUrl={trend.newsArticleUrl}
            googleTrendsUrl={trend.googleTrendsUrl}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
