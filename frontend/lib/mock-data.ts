import type { MomentumSignal } from './india-states'

export interface TrendScoreFactors {
  trendScore: number
  coOccurrentTags: string[]
}

export type FreshnessTier = 'live' | 'recent' | 'today' | 'aging'

export type MomentumDirection = 'rising' | 'stable' | 'falling'

export interface MomentumChannel {
  key: string
  labelHi: string
  labelEn: string
  strength: number
  direction: MomentumDirection
  detailHi: string
}

export interface SourceBreakdownDetail {
  googleTrendsScore: number
  rssMentions: number
  rssSources: string[]
  googleRank: number | null
  xScore: number
  xMentions: number
  xRank: number | null
}

export interface TrendExplainability {
  whyRising: string
  localRelevance: string
  freshnessTier: FreshnessTier
  freshnessLabelHi: string
  freshnessLabelEn: string
  momentumChannels: MomentumChannel[]
  rssSourceNames: string[]
}

export interface Trend {
  id: string
  topic: string
  hashtag: string
  hindiHashtag: string
  category: string
  heatScore: number
  momentum: MomentumSignal
  trendScore: TrendScoreFactors
  relatedTags: string[]
  whyTrending: string
  hindiSummary: string
  freshness: string
  lastUpdated?: string
  sources: Source[]
  relatedTrends?: string[]
  engagement: EngagementStats
  trendingReason: string
  festivalName?: string | null
  newsArticleUrl?: string
  googleTrendsUrl?: string
  indiaReachPct?: number
  updatedMinutesAgo?: number
  sourceBreakdown?: SourceBreakdownDetail
  explainability?: TrendExplainability
}

export interface Source {
  name: string
  icon: string
  count: number
  color: string
}

export interface EngagementStats {
  views: string
  viewCount?: number
  shares: string
  likes: string
  comments: string
}

export interface TrendCategory {
  id: string
  label: string
  labelEn: string
  count?: number
}

