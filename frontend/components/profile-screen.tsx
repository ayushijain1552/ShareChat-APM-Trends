'use client'

import { motion } from 'framer-motion'
import { User, Settings, Bookmark, History, Heart, Share2, Bell, ChevronRight, LogOut, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Saved', value: '24', icon: Bookmark },
  { label: 'Liked', value: '156', icon: Heart },
  { label: 'Shared', value: '89', icon: Share2 },
]

const menuItems = [
  { icon: Bookmark, label: 'Saved Trends', badge: '24' },
  { icon: History, label: 'View History', badge: null },
  { icon: Bell, label: 'Notifications', badge: '3' },
  { icon: Crown, label: 'SC Plus', badge: 'NEW' },
  { icon: Settings, label: 'Settings', badge: null },
]

export function ProfileScreen() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="relative">
        {/* Background accent */}
        <div className="absolute inset-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />
        
        <div className="relative px-4 pt-6 pb-4">
          <div className="flex justify-end mb-4">
            <button className="p-2 rounded-full bg-card text-foreground border border-border">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-3 ring-4 ring-card"
            >
              <User className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-xl font-bold text-foreground">Anuj Sharma</h1>
            <p className="text-sm text-muted-foreground">@anuj_trends</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">
              Discovering trending content
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5">
        {/* Stats */}
        <section>
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="card-sharechat p-4 text-center"
                >
                  <Icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Interests */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2.5">Your Interests</h2>
          <div className="flex flex-wrap gap-2">
            {['Cricket', 'Bollywood', 'Tech', 'Food', 'Music'].map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </section>

        {/* Menu Items */}
        <section className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="w-full flex items-center justify-between p-3.5 card-sharechat"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      item.badge === 'NEW' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.button>
            )
          })}
        </section>

        {/* Sign Out */}
        <button className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-destructive/30 text-destructive font-medium text-sm">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0
        </p>
      </main>
    </div>
  )
}
