"""Pydantic models for API responses and internal signal carriers."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RawSignal(BaseModel):
    topic: str
    source: str
    google_rank: int | None = None
    rss_count: int = 0
    latest_seen: datetime | None = None
    sample_headlines: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class TrendScoreFactors(BaseModel):
    trend_score: float
    co_occurrent_tags: list[str] = Field(default_factory=list)


class SourceBreakdown(BaseModel):
    google_trends_score: float = 0.0
    rss_mentions: int = 0
    rss_sources: list[str] = Field(default_factory=list)
    google_rank: int | None = None
    x_score: float = 0.0
    x_mentions: int = 0
    x_rank: int | None = None


class MomentumChannel(BaseModel):
    key: str
    label_hi: str
    label_en: str
    strength: float
    direction: str
    detail_hi: str = ""


class TrendExplainability(BaseModel):
    why_rising: str
    local_relevance: str
    freshness_tier: str
    freshness_label_hi: str
    freshness_label_en: str
    momentum_channels: list[MomentumChannel] = Field(default_factory=list)
    rss_source_names: list[str] = Field(default_factory=list)


class TrendItem(BaseModel):
    topic: str
    hashtag: str
    category: str
    category_label_en: str = ""
    category_label_hi: str = ""
    heat_score: float
    momentum: str = "stable"
    india_reach_pct: float = 0.0
    trend_score: TrendScoreFactors
    related_tags: list[str] = Field(default_factory=list)
    hindi_description: str
    why_trending: str
    updated_minutes_ago: int
    last_updated: datetime
    view_count: int
    source_breakdown: SourceBreakdown
    explainability: TrendExplainability
    festival_name: str | None = None
    news_article_url: str
    google_trends_url: str


class CategoryInfo(BaseModel):
    id: str
    label_hi: str
    label_en: str
    count: int


class TrendsResponse(BaseModel):
    trends: list[TrendItem]
    categories: list[CategoryInfo]
    total_view_count: int
    last_updated: datetime
    cached: bool
    generated_at: datetime
