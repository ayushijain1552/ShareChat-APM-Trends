"""TrendScore = MentionVelocity × UniqueUsers × EngagementRate × RegionalSpread / SpamProbability"""

from __future__ import annotations

import math
from datetime import datetime, timezone

from app.utils.acronym_hi import is_acronym_token
from app.utils.hindi import build_hashtag
from app.utils.states_hi import detect_state_codes
from app.utils.tag_extraction import _ACRONYM_RE, _format_tag, _score_candidates
from app.utils.topic_match import is_weak_merge_token


def _recency_factor(latest: datetime | None) -> float:
    if latest is None:
        return 0.5
    now = datetime.now(timezone.utc)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    age_hours = (now - latest).total_seconds() / 3600
    if age_hours <= 1:
        return 1.0
    if age_hours <= 6:
        return 0.85
    if age_hours <= 24:
        return 0.65
    if age_hours <= 72:
        return 0.4
    return 0.2


def compute_trend_score(
    topic: str,
    headlines: list[str],
    heat: float,
    view_count: int,
    rss_count: int,
    x_mentions: int,
    google_rank: int | None,
    x_rank: int | None,
    rss_sources: list[str],
    latest_seen: datetime | None,
) -> dict[str, float]:
    recency = _recency_factor(latest_seen)

    mention_velocity = min(
        1.0,
        (rss_count * 0.35 + x_mentions * 0.25 + (1.0 if google_rank and google_rank <= 10 else 0)) * recency,
    )
    if mention_velocity < 0.05:
        mention_velocity = 0.05 + heat * 0.2

    unique_users = min(1.0, math.log10(max(1, view_count)) / 7.0)
    if unique_users < 0.1:
        unique_users = 0.1 + heat * 0.4

    engagement_rate = min(1.0, heat * 0.85 + (0.15 if x_mentions >= 2 else 0))
    if engagement_rate < 0.08:
        engagement_rate = 0.08

    blob = f"{topic} {' '.join(headlines[:10])}"
    states = detect_state_codes(blob)
    regional_spread = min(1.0, len(states) / 8.0 + heat * 0.25)
    if regional_spread < 0.1:
        regional_spread = 0.1 + heat * 0.3

    source_count = sum(
        1
        for flag in (
            google_rank is not None,
            x_rank is not None,
            rss_count > 0,
        )
        if flag
    )
    spam_probability = max(0.12, 1.0 - source_count * 0.22 - len(rss_sources) * 0.04)

    raw = (
        mention_velocity * unique_users * engagement_rate * regional_spread
    ) / spam_probability
    trend_score = round(min(100.0, raw * 18.0), 1)

    return {
        "trend_score": trend_score,
        "mention_velocity": round(mention_velocity, 3),
        "unique_users": round(unique_users, 3),
        "engagement_rate": round(engagement_rate, 3),
        "regional_spread": round(regional_spread, 3),
        "spam_probability": round(spam_probability, 3),
    }


def _topic_tokens(topic: str) -> set[str]:
    topic_norm = topic.lower().strip()
    return {t for t in topic_norm.split() if len(t) > 2 and not is_weak_merge_token(t)}


def _add_tag(tags: list[str], seen: set[str], phrase: str, topic_norm: str) -> bool:
    lower = phrase.lower().strip()
    if not lower or lower == topic_norm:
        return False
    is_acro = is_acronym_token(phrase)
    if not is_acro and len(lower.split()) > 2:
        return False
    if not is_acro and len(lower.split()) > 3:
        return False
    tag = build_hashtag(_format_tag(phrase))
    body = tag.lstrip("#")
    if not is_acro and len(body) > 16:
        return False
    key = tag.lower()
    if key in seen:
        return False
    seen.add(key)
    tags.append(tag)
    return True


def extract_co_occurrent_tags(
    topic: str,
    headlines: list[str],
    limit: int = 6,
) -> list[str]:
    """
    Hashtags for terms that appear alongside the main topic in the same headlines.
    """
    if not headlines:
        return []

    topic_norm = topic.lower().strip()
    topic_toks = _topic_tokens(topic)
    tags: list[str] = []
    seen: set[str] = set()

    # Short acronyms co-mentioned in headlines (RCB, BCCI, …)
    for headline in headlines:
        for match in _ACRONYM_RE.finditer(headline):
            token = match.group(0)
            if token.lower() in topic_toks or token.lower() == topic_norm:
                continue
            if len(tags) >= limit:
                return tags[:limit]
            _add_tag(tags, seen, token, topic_norm)

    ranked = _score_candidates(headlines)
    for phrase, _score in ranked.most_common(20):
        if len(tags) >= limit:
            break
        lower = phrase.lower()
        if lower in topic_toks:
            continue
        if topic_norm in lower and len(lower.split()) <= 2:
            continue
        phrase_tokens = {w for w in lower.split() if len(w) > 2}
        if phrase_tokens and phrase_tokens <= topic_toks:
            continue
        if any(is_weak_merge_token(w) for w in phrase.split()):
            continue
        _add_tag(tags, seen, phrase, topic_norm)

    return tags[:limit]


def build_trend_score_response(
    topic: str,
    headlines: list[str],
    heat: float,
    view_count: int,
    rss_count: int,
    x_mentions: int,
    google_rank: int | None,
    x_rank: int | None,
    rss_sources: list[str],
    latest_seen: datetime | None,
) -> dict[str, float | list[str]]:
    """API-facing payload: score for ranking + co-occurrent tags (no factor numbers)."""
    internal = compute_trend_score(
        topic,
        headlines,
        heat,
        view_count,
        rss_count,
        x_mentions,
        google_rank,
        x_rank,
        rss_sources,
        latest_seen,
    )
    return {
        "trend_score": internal["trend_score"],
        "co_occurrent_tags": extract_co_occurrent_tags(topic, headlines),
    }


def related_tags_for_topic(
    topic: str,
    peers: list[tuple[str, str]],
    limit: int = 6,
) -> list[str]:
    """Peers: (topic, hashtag) for other trends in the same feed."""
    tokens = {t for t in topic.lower().split() if len(t) > 2}
    scored: list[tuple[int, str]] = []
    seen: set[str] = set()
    for other_topic, hashtag in peers:
        if other_topic.lower() == topic.lower():
            continue
        if hashtag in seen:
            continue
        other_tokens = {t for t in other_topic.lower().split() if len(t) > 2}
        overlap = len(tokens & other_tokens)
        score = overlap if overlap > 0 else 0
        if score == 0 and tokens:
            # same category-style fallback: any peer
            score = 1
        if score > 0:
            scored.append((score, hashtag))
            seen.add(hashtag)
    scored.sort(key=lambda x: x[0], reverse=True)
    tags = [h for _, h in scored[:limit]]
    if len(tags) < limit:
        for other_topic, hashtag in peers:
            if other_topic.lower() == topic.lower() or hashtag in tags:
                continue
            tags.append(hashtag)
            if len(tags) >= limit:
                break
    return tags[:limit]
