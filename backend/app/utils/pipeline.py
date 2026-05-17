"""Orchestrates collect → normalize → score pipeline."""

from __future__ import annotations

from datetime import datetime, timezone

from app.collectors import fetch_google_trends_signals, fetch_rss_signals, fetch_x_trends_signals
from app.normalization.categories import build_category_list_from_trends
from app.normalization.merger import merge_signals
from app.scoring.scorer import score_merged_topics
from app.utils.models import CategoryInfo, TrendsResponse


def build_trends_response(top_n: int = 10) -> TrendsResponse:
    google = fetch_google_trends_signals()
    rss = fetch_rss_signals()
    x_signals = fetch_x_trends_signals()
    merged = merge_signals(google + rss + x_signals)
    trends = score_merged_topics(merged, top_n=top_n)

    now = datetime.now(timezone.utc)
    total_views = sum(t.view_count for t in trends)
    last_updated = max((t.last_updated for t in trends), default=now)

    category_rows = build_category_list_from_trends(trends)
    categories = [CategoryInfo(**row) for row in category_rows]

    return TrendsResponse(
        trends=trends,
        categories=categories,
        total_view_count=total_views,
        last_updated=last_updated,
        cached=False,
        generated_at=now,
    )
