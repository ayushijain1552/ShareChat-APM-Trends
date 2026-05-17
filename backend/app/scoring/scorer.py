"""Weighted scoring: Google, RSS, X, recency, India relevance."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.scoring.boosts import apply_heuristic_boosts
from app.normalization.categories import ScoredTrendDraft
from app.utils.hindi import (
    build_hashtag,
    hindi_description,
    why_trending,
    why_trending_misc,
)
from app.utils.links import build_google_trends_url, pick_news_article_url
from app.utils.freshness import is_fresh
from app.utils.reach import estimate_india_reach_pct
from app.utils.state_heatmap import derive_momentum
from app.utils.alternate_tag import assign_unique_topics
from app.utils.trend_score import build_trend_score_response, related_tags_for_topic
from app.utils.topic_match import filter_articles_for_topic, filter_headlines_for_topic
from app.utils.explainability import build_explainability
from app.utils.models import SourceBreakdown, TrendExplainability, TrendItem, TrendScoreFactors
from app.utils.views import estimate_view_count

WEIGHT_GOOGLE = 0.32
WEIGHT_RSS = 0.28
WEIGHT_X = 0.15
WEIGHT_RECENCY = 0.10
WEIGHT_INDIA = 0.15

_INDIA_MARKERS = (
    "india", "indian", "bharat", "delhi", "mumbai", "modi", "ipl", "bollywood",
    "rupee", "sensex", "hindi", "cricket", "lok sabha", "neet",
)


def _rank_component(rank: int | None, max_rank: int = 25) -> float:
    if rank is None:
        return 0.0
    return max(0.0, (max_rank - rank + 1) / max_rank)


def _count_component(count: int, max_count: int) -> float:
    if max_count <= 0:
        return 0.0 if count == 0 else 0.5
    return min(1.0, count / max_count)


def _recency_component(latest: datetime | None) -> float:
    if latest is None:
        return 0.3
    now = datetime.now(timezone.utc)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age_hours = (now - latest).total_seconds() / 3600
    if age_hours <= 1:
        return 1.0
    if age_hours <= 6:
        return 0.85
    if age_hours <= 24:
        return 0.6
    if age_hours <= 72:
        return 0.35
    return 0.15


def _india_relevance(topic: str, headlines: list[str]) -> float:
    blob = f"{topic} {' '.join(headlines)}".lower()
    hits = sum(1 for m in _INDIA_MARKERS if m in blob)
    if hits >= 3:
        return 1.0
    if hits == 2:
        return 0.8
    if hits == 1:
        return 0.55
    return 0.45


def _minutes_ago(latest: datetime | None) -> int:
    if latest is None:
        return 30
    now = datetime.now(timezone.utc)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    return max(1, int((now - latest).total_seconds() / 60))


def _resolve_last_updated(latest: datetime | None) -> datetime:
    now = datetime.now(timezone.utc)
    if latest is None:
        return now
    if latest.tzinfo is None:
        return latest.replace(tzinfo=timezone.utc)
    return latest


def _draft_to_item(draft: ScoredTrendDraft, related_tags: list[str] | None = None) -> TrendItem:
    heat_display = round(draft.heat * 100, 1)
    last_updated = _resolve_last_updated(draft.latest_seen)

    headlines = filter_headlines_for_topic(draft.topic, draft.headlines)
    articles = filter_articles_for_topic(draft.topic, draft.articles)

    explanation = why_trending(
        draft.topic,
        draft.india_reach_pct,
        draft.google_rank,
        draft.x_rank,
        draft.rss_count,
        draft.rss_sources,
        headlines=headlines,
    )

    news_url = pick_news_article_url(draft.topic, articles)
    google_url = build_google_trends_url(draft.topic)
    momentum = derive_momentum(draft.google_rank, draft.x_rank)
    score_factors = build_trend_score_response(
        draft.topic,
        headlines,
        draft.heat,
        draft.view_count,
        draft.rss_count,
        draft.x_mentions,
        draft.google_rank,
        draft.x_rank,
        draft.rss_sources,
        draft.latest_seen,
    )

    explain_raw = build_explainability(
        draft.topic,
        draft.india_reach_pct,
        draft.google_rank,
        draft.x_rank,
        draft.rss_count,
        draft.rss_sources,
        draft.google_score,
        draft.x_score,
        draft.latest_seen,
        headlines=headlines,
    )

    return TrendItem(
        topic=draft.topic,
        hashtag=build_hashtag(draft.topic),
        category=draft.category,
        category_label_en=draft.category_label_en,
        category_label_hi=draft.category_label_hi,
        heat_score=heat_display,
        momentum=momentum,
        india_reach_pct=draft.india_reach_pct,
        trend_score=TrendScoreFactors(**score_factors),
        related_tags=related_tags or [],
        hindi_description=hindi_description(
            draft.topic,
            headlines=headlines,
            articles=articles,
        ),
        why_trending=explanation,
        news_article_url=news_url,
        google_trends_url=google_url,
        updated_minutes_ago=_minutes_ago(draft.latest_seen),
        last_updated=last_updated,
        view_count=draft.view_count,
        festival_name=None,
        source_breakdown=SourceBreakdown(
            google_trends_score=round(draft.google_score, 3),
            rss_mentions=draft.rss_count,
            rss_sources=draft.rss_sources,
            google_rank=draft.google_rank,
            x_score=round(draft.x_score, 3),
            x_mentions=draft.x_mentions,
            x_rank=draft.x_rank,
        ),
        explainability=TrendExplainability(**explain_raw),
    )


def score_merged_topics(merged: list[dict[str, Any]], top_n: int = 10) -> list[TrendItem]:
    if not merged:
        return []

    max_rss = max((m.get("rss_count", 0) for m in merged), default=1)
    max_x = max((m.get("x_mentions", 0) for m in merged), default=1)
    drafts: list[tuple[float, ScoredTrendDraft]] = []

    for m in merged:
        topic = m["topic"]
        headlines = m.get("headlines", [])
        latest = m.get("latest_seen")
        if latest is not None and not is_fresh(latest):
            continue
        if not headlines and m.get("rss_count", 0) > 0:
            continue

        google = _rank_component(m.get("google_rank"))
        x_rank = m.get("x_rank")
        x_score = _rank_component(x_rank)
        rss = _count_component(m.get("rss_count", 0), max_rss)
        x_mentions = m.get("x_mentions", 0)
        x_mention_score = _count_component(x_mentions, max_x)
        x_combined = max(x_score, x_mention_score)

        recency = _recency_component(m.get("latest_seen"))
        india = _india_relevance(topic, headlines)

        base = (
            WEIGHT_GOOGLE * google
            + WEIGHT_RSS * rss
            + WEIGHT_X * x_combined
            + WEIGHT_RECENCY * recency
            + WEIGHT_INDIA * india
        )

        heat, boost_reasons = apply_heuristic_boosts(topic, base)
        rss_sources: list[str] = m.get("rss_sources", [])

        view_count = estimate_view_count(
            heat,
            m.get("rss_count", 0),
            m.get("google_rank"),
            x_rank,
            m.get("x_volume", 0),
        )

        india_reach_pct = estimate_india_reach_pct(
            view_count,
            heat,
            m.get("google_rank"),
            x_rank,
            m.get("rss_count", 0),
            x_mentions,
        )

        draft = ScoredTrendDraft(
            topic=topic,
            category=m.get("category", "trending"),
            category_label_en=m.get("category_label_en", topic),
            category_label_hi=m.get("category_label_hi", topic),
            heat=heat,
            boost_reasons=boost_reasons,
            google_rank=m.get("google_rank"),
            x_rank=x_rank,
            rss_count=m.get("rss_count", 0),
            x_mentions=x_mentions,
            rss_sources=rss_sources,
            google_score=google,
            x_score=x_combined,
            latest_seen=m.get("latest_seen"),
            headlines=headlines,
            view_count=view_count,
            india_reach_pct=india_reach_pct,
            articles=m.get("articles", []),
        )
        drafts.append((heat, draft))

    drafts.sort(key=lambda x: x[0], reverse=True)
    top = assign_unique_topics(drafts[:top_n])
    peers = [(draft.topic, build_hashtag(draft.topic)) for _, draft in top]
    return [
        _draft_to_item(
            draft,
            related_tags=related_tags_for_topic(draft.topic, peers),
        )
        for _, draft in top
    ]
