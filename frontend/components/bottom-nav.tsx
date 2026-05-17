'use client'

import { motion } from 'framer-motion'
import { Home, Compass, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'feed', icon: Home, label: 'Home' },
  { id: 'explore', icon: Compass, label: 'Explore' },
  { id: 'favourites', icon: Heart, label: 'Favourites' },
  { id: 'profile', icon: User, label: 'Account' },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <motion.div layout className="flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <motion.button
              layout
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-transform duration-150',
                  isActive && 'scale-105',
                  tab.id === 'favourites' && isActive && 'fill-primary',
                )}
              />
              <span
                className={cn(
                  'text-[10px] mt-0.5 font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </motion.button>
          )
        })}
      </motion.div>
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  )
}
