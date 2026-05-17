"""Merge overlapping topics via keyword overlap and fuzzy matching."""

from __future__ import annotations

import re
from typing import Any

from rapidfuzz import fuzz

from app.utils.models import RawSignal
from app.normalization.categories import derive_category_from_content
from app.utils.freshness import filter_fresh_articles, filter_fresh_headlines_from_articles, is_fresh
from app.utils.tag_extraction import extract_cluster_tag, should_publish_cluster
from app.utils.topic_match import (
    filter_articles_for_topic,
    filter_headlines_for_topic,
    is_weak_merge_token,
    strong_topic_tokens,
)

# Tradeoff: 82 threshold balances duplicate collapse vs over-merging distinct stories.
FUZZY_MERGE_THRESHOLD = 82


def _normalize_key(topic: str) -> str:
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", topic.lower())
    return re.sub(r"\s+", " ", text).strip()


def _substring_merge_allowed(short: str, long_text: str) -> bool:
    """Avoid merging bare years ('2026') into unrelated topics like IPL."""
    if is_weak_merge_token(short) or len(short) < 4:
        return False
    return bool(re.search(rf"\b{re.escape(short)}\b", long_text))


def _should_merge(a: str, b: str) -> bool:
    na, nb = _normalize_key(a), _normalize_key(b)
    if not na or not nb:
        return False
    if na == nb:
        return True

    short, long_text = (na, nb) if len(na) <= len(nb) else (nb, na)
    if short != long_text and _substring_merge_allowed(short, long_text):
        return True

    strong_a, strong_b = strong_topic_tokens(a), strong_topic_tokens(b)
    overlap = strong_a & strong_b
    if len(overlap) >= 2:
        return True
    if len(overlap) == 1 and len(strong_a) >= 1 and len(strong_b) >= 1:
        score = fuzz.token_set_ratio(na, nb)
        return score >= FUZZY_MERGE_THRESHOLD

    if not strong_a or not strong_b:
        return False

    score = fuzz.token_set_ratio(na, nb)
    return score >= FUZZY_MERGE_THRESHOLD


def _pick_canonical_topic(topics: list[str], google_topic: str | None = None) -> str:
    """Prefer Google Trends label; otherwise shortest strong label (not RSS year shards)."""
    if google_topic and google_topic in topics:
        return google_topic
    candidates = [t for t in topics if strong_topic_tokens(t)]
    pool = candidates or topics
    return min(pool, key=lambda t: (len(t.split()), len(t)))


def merge_signals(signals: list[RawSignal]) -> list[dict[str, Any]]:
    """
    Collapse duplicate topics into merged records ready for scoring.

    Returns dicts with topic, google/x ranks, rss/x counts, latest_seen, headlines, sources
    """
    clusters: list[dict[str, Any]] = []

    for signal in signals:
        topic = signal.topic.strip()
        if len(topic) < 2:
            continue
        # Drop RSS shards that are only a year (e.g. "2026" from exam headlines)
        if signal.google_rank is None and not strong_topic_tokens(topic):
            continue

        matched_idx: int | None = None
        for i, cluster in enumerate(clusters):
            if _should_merge(topic, cluster["topic"]):
                matched_idx = i
                break

        # Skip sentence-length noise; keeps topics ShareChat-hashtag friendly
        if len(topic) > 80 or len(topic.split()) > 8:
            continue

        x_rank = signal.metadata.get("x_rank")
        x_volume = signal.metadata.get("x_volume", 0)

        if matched_idx is None:
            clusters.append(
                {
                    "topics": [topic],
                    "topic": topic,
                    "google_topic": topic if signal.google_rank is not None else None,
                    "google_rank": signal.google_rank,
                    "x_rank": x_rank,
                    "x_volume": x_volume,
                    "rss_count": signal.rss_count,
                    "x_mentions": 1 if signal.source == "x" else 0,
                    "latest_seen": signal.latest_seen,
                    "headlines": list(signal.sample_headlines),
                    "articles": list(signal.metadata.get("articles", [])),
                    "rss_sources": set(signal.metadata.get("rss_sources", [])),
                }
            )
            continue

        cluster = clusters[matched_idx]
        cluster["topics"].append(topic)
        if signal.google_rank is not None:
            cluster["google_topic"] = topic
        cluster["topic"] = _pick_canonical_topic(
            cluster["topics"],
            google_topic=cluster.get("google_topic"),
        )

        if signal.google_rank is not None:
            if cluster["google_rank"] is None or signal.google_rank < cluster["google_rank"]:
                cluster["google_rank"] = signal.google_rank

        if x_rank is not None:
            cur = cluster.get("x_rank")
            if cur is None or x_rank < cur:
                cluster["x_rank"] = x_rank
                cluster["x_volume"] = max(cluster.get("x_volume", 0), x_volume)

        if signal.source == "x":
            cluster["x_mentions"] = cluster.get("x_mentions", 0) + 1

        cluster["rss_count"] += signal.rss_count
        cluster["headlines"].extend(signal.sample_headlines)
        cluster.setdefault("articles", []).extend(signal.metadata.get("articles", []))
        cluster["rss_sources"].update(signal.metadata.get("rss_sources", []))

        if signal.latest_seen:
            if cluster["latest_seen"] is None or signal.latest_seen > cluster["latest_seen"]:
                cluster["latest_seen"] = signal.latest_seen

    for cluster in clusters:
        canonical = cluster["topic"]
        cluster["rss_sources"] = sorted(cluster["rss_sources"])
        cluster["headlines"] = list(
            dict.fromkeys(filter_headlines_for_topic(canonical, cluster["headlines"]))
        )[:8]
        seen_urls: set[str] = set()
        deduped_articles: list[dict[str, str]] = []
        for art in cluster.get("articles", []):
            url = art.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                deduped_articles.append(art)
        cluster["articles"] = filter_fresh_articles(
            filter_articles_for_topic(canonical, deduped_articles)
        )[:8]
        if cluster["articles"]:
            cluster["headlines"] = filter_fresh_headlines_from_articles(cluster["articles"])
        elif cluster.get("rss_count", 0) > 0 or cluster.get("google_rank") is None:
            cluster["_drop"] = True
            continue
        if cluster.get("latest_seen") and not is_fresh(cluster["latest_seen"]):
            cluster["_drop"] = True
            continue

        seed = cluster.get("google_topic") or canonical
        tag = extract_cluster_tag(cluster["headlines"], seed)
        if not tag:
            cluster["_drop"] = True
            continue
        cluster["tag"] = tag
        cluster["topic"] = tag
        cluster["headlines"] = filter_headlines_for_topic(tag, cluster["headlines"])
        cluster["articles"] = filter_articles_for_topic(tag, cluster.get("articles", []))
        cat_id, label_en, label_hi = derive_category_from_content(tag, cluster["headlines"])
        cluster["category"] = cat_id
        cluster["category_label_en"] = label_en
        cluster["category_label_hi"] = label_hi

    return [c for c in clusters if not c.get("_drop") and should_publish_cluster(c)]
