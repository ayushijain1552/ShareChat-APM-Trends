import { resolveCategories } from '@/lib/categories'
import type { MomentumSignal } from '@/lib/india-states'
import type { Source, Trend, TrendCategory, TrendScoreFactors } from '@/lib/mock-data'
import {
  mapApiExplainability,
  mapApiSourceBreakdown,
} from '@/lib/trend-explainability'
import { buildFallbackTrendScore } from '@/lib/trend-score'

export const TRENDS_API_URL =
  process.env.NEXT_PUBLIC_TRENDS_API_URL ?? 'http://127.0.0.1:8010/trends'

export interface ApiSourceBreakdown {
  google_trends_score: number
  rss_mentions: number
  rss_sources: string[]
  google_rank: number | null
  x_score: number
  x_mentions: number
  x_rank: number | null
}

export interface ApiMomentumChannel {
  key: string
  label_hi: string
  label_en: string
  strength: number
  direction: string
  detail_hi: string
}

export interface ApiTrendExplainability {
  why_rising: string
  local_relevance: string
  freshness_tier: string
  freshness_label_hi: string
  freshness_label_en: string
  momentum_channels: ApiMomentumChannel[]
  rss_source_names: string[]
}

export interface ApiTrendScoreFactors {
  trend_score: number
  co_occurrent_tags?: string[]
}

export interface ApiTrendItem {
  topic: string
  hashtag: string
  category: string
  heat_score: number
  momentum?: string
  trend_score?: ApiTrendScoreFactors
  related_tags?: string[]
  hindi_description: string
  why_trending: string
  updated_minutes_ago: number
  last_updated: string
  view_count: number
  festival_name: string | null
  india_reach_pct: number
  category_label_en: string
  category_label_hi: string
  news_article_url: string
  google_trends_url: string
  source_breakdown: ApiSourceBreakdown
  explainability?: ApiTrendExplainability
}

export interface ApiCategoryInfo {
  id: string
  label_hi: string
  label_en: string
  count: number
}

export interface ApiTrendsResponse {
  trends: ApiTrendItem[]
  categories: ApiCategoryInfo[]
  total_view_count: number
  last_updated: string
  cached: boolean
  generated_at: string
}

export interface TrendsPayload {
  trends: Trend[]
  categories: TrendCategory[]
  totalViewCount: number
  lastUpdated: string
  cached: boolean
}

function formatFreshness(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatLastUpdated(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function deriveMomentum(item: ApiTrendItem): MomentumSignal {
  if (item.momentum === 'rising' || item.momentum === 'falling' || item.momentum === 'stable') {
    return item.momentum
  }
  const rank = item.source_breakdown.google_rank ?? item.source_breakdown.x_rank
  if (rank != null && rank <= 5) return 'rising'
  if (rank != null && rank >= 15) return 'falling'
  return 'stable'
}

function mapTrendScore(
  raw: ApiTrendScoreFactors | undefined,
  heatScore: number,
): TrendScoreFactors {
  if (!raw) return buildFallbackTrendScore(heatScore)
  return {
    trendScore: raw.trend_score,
    coOccurrentTags: raw.co_occurrent_tags ?? [],
  }
}

function buildSources(breakdown: ApiSourceBreakdown): Source[] {
  const sources: Source[] = []

  if (breakdown.google_rank != null || breakdown.google_trends_score > 0) {
    sources.push({
      name: 'Google Trends',
      icon: '📈',
      count: Math.max(
        Math.round(breakdown.google_trends_score * 10_000),
        breakdown.google_rank != null ? Math.max(1, 26 - breakdown.google_rank) * 1000 : 0,
      ),
      color: 'bg-chart-4',
    })
  }

  if (breakdown.x_rank != null || breakdown.x_mentions > 0) {
    sources.push({
      name: 'X',
      icon: '𝕏',
      count: Math.max(
        breakdown.x_mentions * 5000,
        breakdown.x_rank != null ? Math.max(1, 26 - breakdown.x_rank) * 900 : 0,
      ),
      color: 'bg-foreground',
    })
  }

  if (breakdown.rss_mentions > 0) {
    const label = breakdown.rss_sources[0] ?? 'News RSS'
    sources.push({
      name: label,
      icon: '📰',
      count: breakdown.rss_mentions,
      color: 'bg-accent',
    })
  }

  if (sources.length === 0) {
    sources.push({
      name: 'Trending',
      icon: '🔥',
      count: 1,
      color: 'bg-primary',
    })
  }

  return sources
}

function buildEngagement(viewCount: number, heatScore: number): Trend['engagement'] {
  const base = Math.max(viewCount, heatScore * 10_000)
  return {
    views: formatCount(base),
    viewCount: base,
    likes: formatCount(Math.round(base * 0.18)),
    shares: formatCount(Math.round(base * 0.06)),
    comments: formatCount(Math.round(base * 0.04)),
  }
}

export function mapApiTrendToTrend(item: ApiTrendItem, index: number): Trend {
  const breakdown = item.source_breakdown
  const sourceBreakdown = mapApiSourceBreakdown(breakdown)
  const heatScore = Math.round(item.heat_score)
  const hashtag = item.hashtag.startsWith('#') ? item.hashtag : `#${item.hashtag}`

  return {
    id: `${item.category}-${hashtag}-${index}`,
    topic: item.topic,
    hashtag,
    hindiHashtag: hashtag,
    category: item.category,
    heatScore,
    momentum: deriveMomentum(item),
    trendScore: mapTrendScore(item.trend_score, heatScore),
    relatedTags: item.related_tags ?? [],
    whyTrending: item.why_trending,
    hindiSummary: item.hindi_description,
    freshness: formatFreshness(item.updated_minutes_ago),
    lastUpdated: item.last_updated,
    sources: buildSources(breakdown),
    engagement: buildEngagement(item.view_count, heatScore),
    trendingReason: item.why_trending,
    festivalName: item.festival_name,
    indiaReachPct: item.india_reach_pct,
    newsArticleUrl: item.news_article_url,
    googleTrendsUrl: item.google_trends_url,
    indiaReachPct: item.india_reach_pct,
    updatedMinutesAgo: item.updated_minutes_ago,
    sourceBreakdown,
    explainability: mapApiExplainability(item, sourceBreakdown),
  }
}

export async function fetchTrends(): Promise<TrendsPayload> {
  const response = await fetch(TRENDS_API_URL, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Could not load trends (${response.status})`)
  }

  const data: ApiTrendsResponse = await response.json()
  const trends = data.trends.map(mapApiTrendToTrend)
  return {
    trends,
    categories: resolveCategories(data.categories, trends),
    totalViewCount: data.total_view_count,
    lastUpdated: formatLastUpdated(data.last_updated),
    cached: data.cached,
  }
}
