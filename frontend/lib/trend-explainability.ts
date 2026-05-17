import type {
  FreshnessTier,
  MomentumChannel,
  MomentumDirection,
  SourceBreakdownDetail,
  Trend,
  TrendExplainability,
} from '@/lib/mock-data'
import type { ApiSourceBreakdown, ApiTrendItem } from '@/lib/trends-api'

function rankStrength(rank: number | null, maxRank = 25): number {
  if (rank == null) return 18
  return Math.max(12, Math.min(100, (maxRank - rank + 1) * 4.2))
}

function rankDirection(rank: number | null): MomentumDirection {
  if (rank == null) return 'stable'
  if (rank <= 5) return 'rising'
  if (rank >= 15) return 'falling'
  return 'stable'
}

export function freshnessFromMinutes(minutes: number): {
  tier: FreshnessTier
  labelHi: string
  labelEn: string
} {
  if (minutes < 30) {
    return { tier: 'live', labelHi: 'लाइव — अभी अपडेट', labelEn: 'Live — just updated' }
  }
  if (minutes < 180) {
    return { tier: 'recent', labelHi: 'हाल की खबर', labelEn: 'Recent coverage' }
  }
  if (minutes < 1440) {
    return { tier: 'today', labelHi: 'आज की चर्चा', labelEn: 'Trending today' }
  }
  return { tier: 'aging', labelHi: 'पिछले कुछ दिनों की खबर', labelEn: 'From the past few days' }
}

function buildMomentumChannels(breakdown: SourceBreakdownDetail): MomentumChannel[] {
  const channels: MomentumChannel[] = []

  if (breakdown.googleRank != null || breakdown.googleTrendsScore > 0) {
    channels.push({
      key: 'google',
      labelHi: 'गूगल ट्रेंड्स',
      labelEn: 'Google Trends',
      strength: Math.round(
        rankStrength(breakdown.googleRank) * (0.85 + breakdown.googleTrendsScore * 0.15),
      ),
      direction: rankDirection(breakdown.googleRank),
      detailHi:
        breakdown.googleRank != null
          ? `भारत में रैंक #${breakdown.googleRank}`
          : 'खोज में मजबूत सिग्नल',
    })
  }

  if (breakdown.xRank != null || breakdown.xMentions > 0 || breakdown.xScore > 0) {
    channels.push({
      key: 'x',
      labelHi: 'एक्स (ट्विटर)',
      labelEn: 'X',
      strength: Math.round(rankStrength(breakdown.xRank) * (0.8 + breakdown.xScore * 0.2)),
      direction: rankDirection(breakdown.xRank),
      detailHi:
        breakdown.xRank != null ? `ट्रेंडिंग लिस्ट में #${breakdown.xRank}` : 'सोशल चर्चा बढ़ रही है',
    })
  }

  if (breakdown.rssMentions > 0) {
    channels.push({
      key: 'news',
      labelHi: 'भारतीय न्यूज़',
      labelEn: 'News RSS',
      strength: Math.min(100, Math.round(22 + breakdown.rssMentions * 18)),
      direction: breakdown.rssMentions >= 3 ? 'rising' : 'stable',
      detailHi: `${breakdown.rssMentions} हालिया हेडलाइन`,
    })
  }

  if (channels.length === 0) {
    channels.push({
      key: 'aggregate',
      labelHi: 'संयुक्त सिग्नल',
      labelEn: 'Combined',
      strength: 40,
      direction: 'stable',
      detailHi: 'कई स्रोतों से मिला संकेत',
    })
  }

  return channels
}

function fallbackWhyRising(topic: string, momentum: MomentumDirection): string {
  if (momentum === 'rising') {
    return `「${topic}」अभी तेजी से ऊपर जा रहा है। गूगल, एक्स और न्यूज़ फीड पर नई गतिविधि दिख रही है।`
  }
  if (momentum === 'falling') {
    return `「${topic}」की गति धीमी हो रही है। पहले की तुलना में नए सिग्नल कम आ रहे हैं।`
  }
  return `「${topic}」स्थिर रूप से चर्चा में बना हुआ है।`
}

function fallbackLocalRelevance(indiaReachPct: number, heatScore: number): string {
  const pct = indiaReachPct > 0 ? indiaReachPct : Math.min(89, heatScore * 0.35)
  return (
    `अनुमानित ${pct.toFixed(1)}% भारतीय आबादी डिजिटल स्रोतों पर इस विषय तक पहुँच रही है। ` +
    `यह भारत-केंद्रित ट्रेंड के रूप में रैंक किया गया है।`
  )
}

export function mapApiExplainability(
  item: ApiTrendItem,
  breakdown: SourceBreakdownDetail,
): TrendExplainability {
  const exp = item.explainability
  if (exp) {
    return {
      whyRising: exp.why_rising,
      localRelevance: exp.local_relevance,
      freshnessTier: exp.freshness_tier as FreshnessTier,
      freshnessLabelHi: exp.freshness_label_hi,
      freshnessLabelEn: exp.freshness_label_en,
      momentumChannels: exp.momentum_channels.map((ch) => ({
        key: ch.key,
        labelHi: ch.label_hi,
        labelEn: ch.label_en,
        strength: ch.strength,
        direction: ch.direction as MomentumDirection,
        detailHi: ch.detail_hi,
      })),
      rssSourceNames: exp.rss_source_names ?? breakdown.rssSources,
    }
  }

  const fresh = freshnessFromMinutes(item.updated_minutes_ago)
  const momentum: MomentumDirection =
    item.momentum === 'rising' || item.momentum === 'falling' || item.momentum === 'stable'
      ? item.momentum
      : 'stable'
  return {
    whyRising: fallbackWhyRising(item.topic, momentum),
    localRelevance: fallbackLocalRelevance(item.india_reach_pct, item.heat_score),
    ...fresh,
    momentumChannels: buildMomentumChannels(breakdown),
    rssSourceNames: breakdown.rssSources,
  }
}

export function resolveExplainability(trend: Trend): TrendExplainability {
  if (trend.explainability) return trend.explainability

  const minutes = trend.updatedMinutesAgo ?? 60
  const fresh = freshnessFromMinutes(minutes)
  const breakdown = trend.sourceBreakdown ?? {
    googleTrendsScore: 0,
    rssMentions: 0,
    rssSources: [],
    googleRank: null,
    xScore: 0,
    xMentions: 0,
    xRank: null,
  }

  return {
    whyRising: fallbackWhyRising(trend.topic, trend.momentum),
    localRelevance: fallbackLocalRelevance(
      trend.indiaReachPct ?? 0,
      trend.heatScore,
    ),
    ...fresh,
    momentumChannels: buildMomentumChannels(breakdown),
    rssSourceNames: breakdown.rssSources,
  }
}

export function mapApiSourceBreakdown(b: ApiSourceBreakdown): SourceBreakdownDetail {
  return {
    googleTrendsScore: b.google_trends_score,
    rssMentions: b.rss_mentions,
    rssSources: b.rss_sources ?? [],
    googleRank: b.google_rank,
    xScore: b.x_score,
    xMentions: b.x_mentions,
    xRank: b.x_rank,
  }
}

export interface SourceShareRow {
  key: string
  label: string
  icon: string
  sharePct: number
  metricLabel: string
  color: string
}

export function buildSourceShareRows(
  breakdown: SourceBreakdownDetail,
  rssNames: string[],
): SourceShareRow[] {
  const weights: { key: string; label: string; icon: string; weight: number; metric: string; color: string }[] = []

  if (breakdown.googleRank != null || breakdown.googleTrendsScore > 0) {
    weights.push({
      key: 'google',
      label: 'Google Trends',
      icon: '📈',
      weight: rankStrength(breakdown.googleRank) * (0.7 + breakdown.googleTrendsScore),
      metric:
        breakdown.googleRank != null
          ? `Rank #${breakdown.googleRank} · score ${breakdown.googleTrendsScore.toFixed(2)}`
          : `Score ${breakdown.googleTrendsScore.toFixed(2)}`,
      color: 'bg-chart-4',
    })
  }

  if (breakdown.xRank != null || breakdown.xMentions > 0) {
    weights.push({
      key: 'x',
      label: 'X',
      icon: '𝕏',
      weight: rankStrength(breakdown.xRank) * (0.6 + breakdown.xScore) + breakdown.xMentions * 8,
      metric:
        breakdown.xRank != null
          ? `Rank #${breakdown.xRank} · ${breakdown.xMentions} posts`
          : `${breakdown.xMentions} mentions`,
      color: 'bg-foreground',
    })
  }

  if (breakdown.rssMentions > 0) {
    const src = rssNames[0] ?? breakdown.rssSources[0] ?? 'News RSS'
    weights.push({
      key: 'news',
      label: src,
      icon: '📰',
      weight: 20 + breakdown.rssMentions * 22,
      metric: `${breakdown.rssMentions} headlines`,
      color: 'bg-accent',
    })
  }

  const total = weights.reduce((s, w) => s + w.weight, 0) || 1
  return weights.map((w) => ({
    key: w.key,
    label: w.label,
    icon: w.icon,
    sharePct: Math.round((w.weight / total) * 100),
    metricLabel: w.metric,
    color: w.color,
  }))
}

export function freshnessTierStyles(tier: FreshnessTier): {
  dot: string
  badge: string
  ring: string
} {
  switch (tier) {
    case 'live':
      return {
        dot: 'bg-emerald-500 animate-pulse',
        badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        ring: 'ring-emerald-500/30',
      }
    case 'recent':
      return {
        dot: 'bg-primary',
        badge: 'bg-primary/15 text-primary',
        ring: 'ring-primary/30',
      }
    case 'today':
      return {
        dot: 'bg-chart-4',
        badge: 'bg-chart-4/20 text-chart-4',
        ring: 'ring-chart-4/30',
      }
    default:
      return {
        dot: 'bg-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
        ring: 'ring-border',
      }
  }
}
