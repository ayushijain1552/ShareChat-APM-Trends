'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, AlertCircle } from 'lucide-react'
import { TrendCard } from './trend-card'
import { TrendDetail } from './trend-detail'
import { useFavorites } from '@/lib/favorites-context'
import type { Trend } from '@/lib/mock-data'

export function FavouritesScreen() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <motion.div layout className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold text-foreground">Favourites</h1>
          <p className="text-sm text-muted-foreground">
            Tags you saved from Indian Trends
          </p>
        </div>
      </header>

      <main className="px-4 py-3">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div layout className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <p className="text-base font-medium text-foreground">No favourites yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Tap the heart on any trend tag on Home to save it here.
            </p>
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            {favorites.map((trend, index) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                index={index}
                isFavorite={isFavorite(trend.id)}
                onToggleFavorite={() => toggleFavorite(trend)}
                onSelect={(t) => {
                  setSelectedTrend(t)
                  setIsDetailOpen(true)
                }}
              />
            ))}
          </motion.div>
        )}

        {favorites.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {favorites.length} saved tag{favorites.length === 1 ? '' : 's'}
          </p>
        )}
      </main>

      <TrendDetail
        trend={selectedTrend}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isFavorite={selectedTrend ? isFavorite(selectedTrend.id) : false}
        onToggleFavorite={
          selectedTrend ? () => toggleFavorite(selectedTrend) : undefined
        }
      />
    </motion.div>
  )
}
