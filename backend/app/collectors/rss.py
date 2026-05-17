"""RSS headline collectors for major Indian news outlets."""

from __future__ import annotations

import logging
import re
from collections import defaultdict
from datetime import datetime, timezone

from app.utils.freshness import is_fresh
from time import mktime
from typing import Any

import feedparser

from app.utils.models import RawSignal

logger = logging.getLogger(__name__)

# Stable public RSS endpoints; feedparser handles encoding quirks.
RSS_FEEDS: dict[str, str] = {
    "ndtv": "https://feeds.feedburner.com/ndtvnews-top-stories",
    "times_of_india": "https://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
    "aaj_tak": "https://www.aajtak.in/rssfeeds/?id=home",
    "india_today": "https://www.indiatoday.in/rss/home",
}

# Tradeoff: headline keyword extraction is naive but fast and explainable vs NER models.
_STOPWORDS = frozenset(
    "the a an and or but in on at to for of is are was were be been being "
    "with from as by it this that these those not no yes india indian".split()
)


def _parse_published(entry: dict[str, Any]) -> datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        parsed = entry.get(key)
        if parsed:
            try:
                return datetime.fromtimestamp(mktime(parsed), tz=timezone.utc)
            except (OverflowError, ValueError, TypeError):
                pass
    return None


def _extract_topic_phrases(headline: str, max_phrases: int = 4) -> list[str]:
    """Pull short candidate topics (not full headlines) for merge/scoring."""
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", headline.lower())
    words = [w for w in text.split() if len(w) > 2 and w not in _STOPWORDS]
    phrases: list[str] = []
    for i, word in enumerate(words):
        if re.fullmatch(r"20\d{2}", word):
            continue
        if 4 <= len(word) <= 24:
            phrases.append(word)
        if i < len(words) - 1:
            bigram = f"{words[i]} {words[i + 1]}"
            if 6 <= len(bigram) <= 32:
                phrases.append(bigram)
        if i < len(words) - 2:
            trigram = f"{words[i]} {words[i + 1]} {words[i + 2]}"
            if 8 <= len(trigram) <= 40:
                phrases.append(trigram)
    seen: set[str] = set()
    unique: list[str] = []
    for p in phrases:
        if p not in seen and len(p.split()) <= 4:
            seen.add(p)
            unique.append(p)
    return unique[:max_phrases]


def fetch_rss_signals(max_entries_per_feed: int = 30) -> list[RawSignal]:
    """Aggregate RSS headlines into topic-level signals with mention counts."""
    topic_data: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "rss_count": 0,
            "sources": set(),
            "headlines": [],
            "articles": [],
            "latest": None,
        }
    )

    for source_id, url in RSS_FEEDS.items():
        try:
            parsed = feedparser.parse(url)
            entries = parsed.entries[:max_entries_per_feed]
            for entry in entries:
                title = getattr(entry, "title", "") or ""
                if not title:
                    continue
                link = (getattr(entry, "link", None) or "").strip()
                published = _parse_published(entry)
                if not is_fresh(published):
                    continue
                for phrase in _extract_topic_phrases(title):
                    bucket = topic_data[phrase]
                    bucket["rss_count"] += 1
                    bucket["sources"].add(source_id)
                    if len(bucket["headlines"]) < 5:
                        bucket["headlines"].append(title)
                    if link and len(bucket["articles"]) < 8:
                        bucket["articles"].append(
                            {
                                "title": title,
                                "url": link,
                                "published": published.isoformat() if published else "",
                            }
                        )
                    if published and (bucket["latest"] is None or published > bucket["latest"]):
                        bucket["latest"] = published
        except Exception as exc:
            logger.warning("RSS fetch failed for %s: %s", source_id, exc)

    signals: list[RawSignal] = []
    for topic, data in topic_data.items():
        if data["rss_count"] < 1:
            continue
        signals.append(
            RawSignal(
                topic=topic,
                source="rss_aggregate",
                rss_count=data["rss_count"],
                latest_seen=data["latest"],
                sample_headlines=data["headlines"],
                metadata={
                    "rss_sources": sorted(data["sources"]),
                    "articles": data["articles"],
                },
            )
        )
    return signals
