'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendFeed } from './trend-feed'
import { ExploreScreen } from './explore-screen'
import { ProfileScreen } from './profile-screen'
import { FavouritesScreen } from './favourites-screen'
import { BottomNav } from './bottom-nav'
import { FavoritesProvider } from '@/lib/favorites-context'

export function TrendingApp() {
  const [activeTab, setActiveTab] = useState('feed')

  const renderScreen = () => {
    switch (activeTab) {
      case 'feed':
        return <TrendFeed />
      case 'explore':
        return <ExploreScreen />
      case 'favourites':
        return <FavouritesScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <TrendFeed />
    }
  }

  return (
    <FavoritesProvider>
      <motion.div layout className="max-w-md mx-auto bg-background min-h-screen relative">
        {renderScreen()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </motion.div>
    </FavoritesProvider>
  )
}
