'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Bell, RefreshCw, AlertCircle, WifiOff, Heart } from 'lucide-react'
import { useFavorites } from '@/lib/favorites-context'
import { TrendCard } from './trend-card'
import { CategoryPills } from './category-pills'
import { TrendDetail } from './trend-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ALL_CATEGORY_ID } from '@/lib/categories'
import type { Trend, TrendCategory } from '@/lib/mock-data'
import { fetchTrends } from '@/lib/trends-api'

const TAG_EMOJIS = ['👏', '🏏', '⛽', '🎪', '📰', '🎬', '💰', '🌧️']

function PinwheelLogo() {
  return (
    <motion.div className="w-8 h-8 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 bg-[#FFD93D] rounded-tl-full transform -translate-x-0.5 -translate-y-0.5" />
        <div className="w-3 h-3 bg-[#FF6B35] rounded-tr-full transform translate-x-0.5 -translate-y-0.5" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div className="w-3 h-3 bg-[#4361EE] rounded-bl-full transform -translate-x-0.5 translate-y-0.5" />
        <div className="w-3 h-3 bg-[#7209B7] rounded-br-full transform translate-x-0.5 translate-y-0.5" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-[#06D6A0] rounded-full" />
      </div>
    </motion.div>
  )
}

function TrendCardSkeleton() {
  return (
    <div className="card-sharechat">
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-1 pt-3 border-t border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

function TrendTagsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  )
}

interface TrendsErrorStateProps {
  message: string
  onRetry: () => void
  isRetrying: boolean
}

function TrendsErrorState({ message, onRetry, isRetrying }: TrendsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-destructive" />
      </div>
      <p className="text-base font-semibold text-foreground">Trends unavailable</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{message}</p>
      <p className="text-xs text-muted-foreground mt-2 max-w-xs">
        Make sure the backend is running at http://127.0.0.1:8010
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full disabled:opacity-60"
      >
        <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
        Try again
      </button>
    </div>
  )
}

export function TrendFeed() {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY_ID)
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [trends, setTrends] = useState<Trend[]>([])
  const [categories, setCategories] = useState<TrendCategory[]>([])
  const { isFavorite, toggleFavorite } = useFavorites()
  const [totalViewCount, setTotalViewCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTrends = useCallback(async (options?: { isRefresh?: boolean }) => {
    const isRefresh = options?.isRefresh ?? false

    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const payload = await fetchTrends()
      setTrends(payload.trends)
      setCategories(payload.categories)
      setTotalViewCount(payload.totalViewCount)
      setLastUpdated(payload.lastUpdated)
      setSelectedCategory((prev) => {
        if (prev === ALL_CATEGORY_ID) return prev
        const stillExists = payload.categories.some((c) => c.id === prev)
        return stillExists ? prev : ALL_CATEGORY_ID
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while loading trends.'
      setError(message)
      if (!isRefresh) {
        setTrends([])
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  const filteredTrends = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY_ID) return trends
    return trends.filter((trend) => trend.category === selectedCategory)
  }, [selectedCategory, trends])

  const handleSelectTrend = (trend: Trend) => {
    setSelectedTrend(trend)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
  }

  const handleRefresh = () => {
    if (!isLoading && !isRefreshing) {
      loadTrends({ isRefresh: true })
    }
  }

  const showInitialLoading = isLoading && trends.length === 0 && !error
  const showFeed = !error && !showInitialLoading

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3">
          <motion.div layout className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <PinwheelLogo />
              <span className="text-lg font-bold text-foreground truncate">Indian Trends</span>
            </div>
            <motion.div layout className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh trends"
                className="p-2.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    'w-5 h-5 text-foreground',
                    (isLoading || isRefreshing) && 'animate-spin',
                  )}
                />
              </button>
              <button
                type="button"
                className="p-2.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-foreground" />
              </button>
              <button
                type="button"
                className="relative p-2.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
              </button>
            </motion.div>
          </motion.div>

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {(lastUpdated != null || totalViewCount > 0) && (
            <motion.div
              layout
              className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground"
            >
              {lastUpdated != null && (
                <span>
                  Last updated:{' '}
                  <span className="text-foreground font-medium">{lastUpdated}</span>
                </span>
              )}
              {totalViewCount > 0 && (
                <span>
                  Total views:{' '}
                  <span className="text-foreground font-medium">
                    {totalViewCount >= 1_000_000
                      ? `${(totalViewCount / 1_000_000).toFixed(1)}M`
                      : totalViewCount >= 1_000
                        ? `${(totalViewCount / 1_000).toFixed(1)}K`
                        : totalViewCount}
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </div>
      </header>

      {error && (
        <TrendsErrorState
          message={error}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      )}

      {showInitialLoading && (
        <>
          <div className="px-4 py-3 bg-card border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-2.5">Trending Tags</h2>
            <TrendTagsSkeleton />
          </div>
          <main className="px-4 py-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <TrendCardSkeleton key={i} />
            ))}
          </main>
        </>
      )}

      {showFeed && (
        <>
          <div className="px-4 py-3 bg-card border-b border-border">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-semibold text-foreground">Trending Tags</h2>
              {isRefreshing && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Updating…
                </span>
              )}
            </div>
            {isRefreshing ? (
              <TrendTagsSkeleton />
            ) : filteredTrends.length > 0 ? (
              <div className="space-y-2">
                {filteredTrends.slice(0, 4).map((trend, index) => (
                  <motion.div
                    key={trend.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectTrend(trend)}
                    className="flex items-center justify-between py-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">
                        {TAG_EMOJIS[index % TAG_EMOJIS.length]}
                      </span>
                      <span
                        className="text-sm text-foreground group-hover:text-primary transition-colors truncate"
                        lang="hi"
                      >
                        {trend.hindiHashtag}
                      </span>
                    </div>
                    <motion.div layout className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        aria-label={isFavorite(trend.id) ? 'Remove from favourites' : 'Add to favourites'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(trend)
                        }}
                        className="p-1 rounded-full hover:bg-muted"
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4',
                            isFavorite(trend.id)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground',
                          )}
                        />
                      </button>
                      <span className="text-xs text-muted-foreground">{trend.heatScore}</span>
                      <span className={trend.heatScore >= 80 ? 'text-accent' : 'text-primary'}>
                        {trend.heatScore >= 80 ? '🔥' : '😊'}
                      </span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No tags in this category yet.</p>
            )}
          </div>

          <main className="px-4 py-3">
            <motion.div layout className="space-y-3">
              {isRefreshing
                ? Array.from({ length: 3 }).map((_, i) => <TrendCardSkeleton key={i} />)
                : filteredTrends.map((trend, index) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      index={index}
                      onSelect={handleSelectTrend}
                      isFavorite={isFavorite(trend.id)}
                      onToggleFavorite={() => toggleFavorite(trend)}
                    />
                  ))}
            </motion.div>

            {!isRefreshing && filteredTrends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-base font-medium text-foreground">
                  {trends.length === 0 ? 'No trends yet' : 'No trends found'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {trends.length === 0
                    ? 'Pull to refresh or tap the refresh button'
                    : 'Try a different category'}
                </p>
              </div>
            )}
          </main>
        </>
      )}

      <TrendDetail
        trend={selectedTrend}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        isFavorite={selectedTrend ? isFavorite(selectedTrend.id) : false}
        onToggleFavorite={
          selectedTrend ? () => toggleFavorite(selectedTrend) : undefined
        }
      />
    </div>
  )
}
