import type { Trend, TrendCategory } from '@/lib/mock-data'

export const ALL_CATEGORY_ID = 'all'

export interface CategoryApiRow {
  id: string
  label_hi: string
  label_en: string
  count: number
}

export function mapApiCategories(categories: CategoryApiRow[]): TrendCategory[] {
  return categories.map((c) => ({
    id: c.id,
    label: c.label_hi,
    labelEn: c.label_en,
    count: c.count,
  }))
}

/** Prefer API categories; fall back to counts from trend rows if the list is empty. */
export function resolveCategories(
  apiCategories: CategoryApiRow[],
  trends: Trend[],
): TrendCategory[] {
  if (apiCategories.length > 0) {
    return mapApiCategories(apiCategories)
  }
  return deriveCategoriesFromTrends(trends)
}

function deriveCategoriesFromTrends(trends: Trend[]): TrendCategory[] {
  if (trends.length === 0) return []

  const counts = new Map<string, number>()
  for (const trend of trends) {
    if (trend.category === ALL_CATEGORY_ID) continue
    counts.set(trend.category, (counts.get(trend.category) ?? 0) + 1)
  }

  if (counts.size === 0) {
    return [
      {
        id: ALL_CATEGORY_ID,
        label: 'सभी',
        labelEn: 'All',
        count: trends.length,
      },
    ]
  }

  const dynamic = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      label: formatCategoryId(id),
      labelEn: formatCategoryId(id),
      count,
    }))

  return [
    { id: ALL_CATEGORY_ID, label: 'सभी', labelEn: 'All', count: trends.length },
    ...dynamic,
  ]
}

function formatCategoryId(id: string): string {
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
