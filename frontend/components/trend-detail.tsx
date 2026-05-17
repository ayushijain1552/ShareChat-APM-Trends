'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Share2,
  Bookmark,
  Tag,
  Heart,
  Eye,
  MessageCircle,
  Repeat2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trend } from '@/lib/mock-data'
import { TrendSourceLinks } from './trend-source-links'
import { buildFallbackTrendScore } from '@/lib/trend-score'
import { TrendScorePanel } from './trend-score-panel'
import { TrendExplainabilityPanel } from './trend-explainability'
import { SuggestTagDialog } from './suggest-tag-dialog'

interface TrendDetailProps {
  trend: Trend | null
  isOpen: boolean
  onClose: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function TrendDetail({
  trend,
  isOpen,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: TrendDetailProps) {
  const [suggestOpen, setSuggestOpen] = useState(false)

  if (!trend) return null

  const engagementStats = [
    { icon: Eye, value: trend.engagement.views, label: 'Views' },
    { icon: Heart, value: trend.engagement.likes, label: 'Likes' },
    { icon: Repeat2, value: trend.engagement.shares, label: 'Shares' },
    { icon: MessageCircle, value: trend.engagement.comments, label: 'Comments' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border"
          >
            {/* Handle */}
            <div className="sticky top-0 bg-card z-10 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border mx-auto" />
            </div>

            <div className="px-4 pb-20">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{trend.heatScore >= 90 ? '🔥' : '💛'}</span>
                    <span className="text-sm font-medium text-muted-foreground" lang="hi">
                      {trend.hindiHashtag}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-foreground" lang="hi">
                    {trend.hindiHashtag}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{trend.topic}</p>
                  <motion.div layout className="flex flex-col gap-0.5 mt-1.5 text-muted-foreground">
                    <motion.div layout className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">{trend.freshness}</span>
                    </motion.div>
                    {trend.lastUpdated && (
                      <span className="text-xs pl-5">
                        Last updated:{' '}
                        {new Date(trend.lastUpdated).toLocaleString('en-IN')}
                      </span>
                    )}
                  </motion.div>
                </div>
                <div className="flex items-center gap-1">
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={onToggleFavorite}
                      aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Heart
                        className={cn(
                          'w-5 h-5',
                          isFavorite ? 'fill-primary text-primary' : 'text-foreground',
                        )}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>

              <div className="card-sharechat p-4 mb-5">
                <TrendScorePanel
                  factors={trend.trendScore ?? buildFallbackTrendScore(trend.heatScore)}
                />
              </div>


              {/* Hindi Summary */}
              <div className="card-sharechat p-4 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
                <p className="text-foreground leading-relaxed" lang="hi">
                  {trend.hindiSummary}
                </p>
              </div>

              {/* Why Trending */}
              <div className="card-sharechat p-4 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Why Trending</h3>
                <p className="text-foreground leading-relaxed" lang="hi">
                  {trend.trendingReason}
                </p>
              </div>

              <TrendExplainabilityPanel trend={trend} />

              {/* Engagement Stats */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Engagement</h3>
                <div className="grid grid-cols-4 gap-2">
                  {engagementStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="card-sharechat p-3 text-center">
                        <Icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                        <p className="text-base font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>


              <div className="card-sharechat p-4 mb-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Open in source</h3>
                <TrendSourceLinks
                  newsArticleUrl={trend.newsArticleUrl}
                  googleTrendsUrl={trend.googleTrendsUrl}
                  className="border-0 pt-0"
                />
              </div>

              {/* Explore more tags */}
              {(trend.relatedTags?.length ?? 0) > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Explore more tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(trend.relatedTags ?? []).map((tag) => (
                      <span
                        key={tag}
                        lang="hi"
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground font-medium">
                  <Bookmark className="w-5 h-5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground font-medium text-sm"
                >
                  <Tag className="w-5 h-5 shrink-0" />
                  Suggest alternate tag
                </button>
              </div>

              <SuggestTagDialog
                currentTag={trend.hindiHashtag}
                isOpen={suggestOpen}
                onClose={() => setSuggestOpen(false)}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
