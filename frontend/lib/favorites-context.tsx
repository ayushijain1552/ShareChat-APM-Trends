'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Trend } from '@/lib/mock-data'

const STORAGE_KEY = 'indian-trends-favorites'

type FavoritesContextValue = {
  favorites: Trend[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (trend: Trend) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function readStored(): Trend[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Trend[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Trend[]>([])

  useEffect(() => {
    setFavorites(readStored())
    const onChange = () => setFavorites(readStored())
    window.addEventListener('favorites-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('favorites-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  )

  const toggleFavorite = useCallback((trend: Trend) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === trend.id)
      const next = exists ? prev.filter((f) => f.id !== trend.id) : [...prev, trend]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('favorites-changed'))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  )

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider')
  }
  return ctx
}
