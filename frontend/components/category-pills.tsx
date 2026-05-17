'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ALL_CATEGORY_ID } from '@/lib/categories'
import type { TrendCategory } from '@/lib/mock-data'

interface CategoryPillsProps {
  categories: TrendCategory[]
  selected: string
  onSelect: (id: string) => void
}

export function CategoryPills({ categories, selected, onSelect }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current
      const element = selectedRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      const scrollLeft =
        elementRect.left -
        containerRect.left -
        containerRect.width / 2 +
        elementRect.width / 2 +
        container.scrollLeft

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      })
    }
  }, [selected])

  if (categories.length <= 1) {
    return null
  }

  return (
    <motion.div layout className="relative">
      <motion.div
        layout
        className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
      />
      <motion.div
        layout
        className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
      />

      <motion.div
        layout
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 -mx-4"
      >
        {categories.map((category) => {
          const isSelected = selected === category.id
          return (
            <motion.button
              layout
              key={category.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelect(category.id)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'bg-foreground text-background'
                  : 'bg-card text-foreground border border-border hover:border-muted-foreground/30',
              )}
            >
              <span
                className="relative whitespace-nowrap"
                lang={category.id === ALL_CATEGORY_ID ? undefined : 'hi'}
              >
                {category.label}
                {category.count != null && category.id !== ALL_CATEGORY_ID && (
                  <span className="ml-1.5 text-xs opacity-70">({category.count})</span>
                )}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
