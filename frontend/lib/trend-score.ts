import type { TrendScoreFactors } from '@/lib/mock-data'

/** Client fallback when API has no trend_score payload yet. */
export function buildFallbackTrendScore(
  heatScore: number,
  coOccurrentTags: string[] = [],
): TrendScoreFactors {
  return {
    trendScore: heatScore,
    coOccurrentTags,
  }
}
