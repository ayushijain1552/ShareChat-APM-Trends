"""Dynamic categories derived from clustered headline content (no fixed keyword buckets)."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

from app.utils.hindi import transliterate_topic
from app.utils.tag_extraction import _TAG_STOPWORDS
from app.utils.topic_match import is_weak_merge_token

MISC_ID = "misc"
GENERAL_ID = "general"
ALL_ID = "all"
CRICKET_ID = "cricket"

# Story tags that roll up to the cricket category (not their own pill)
_CRICKET_TOPIC_RE = re.compile(
    r"\b(ipl|cricket|t20|twenty20|odi|test\s+match|bcci|wicket|stadium|"
    r"kohli|rohit|dhoni|ms\s+dhoni|virat)\b",
    re.I,
)

_CATEGORY_LABEL_CACHE: dict[str, dict[str, str]] = {
    CRICKET_ID: {"label_en": "Cricket", "label_hi": "क्रिकेट"},
}


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", text.lower().strip())
    slug = slug.strip("_")
    return slug[:40] if slug else GENERAL_ID


def is_cricket_content(tag: str, headlines: list[str] | None = None) -> bool:
    blob = f"{tag} {' '.join(headlines or [])}"
    return bool(_CRICKET_TOPIC_RE.search(blob))


def derive_category_from_content(
    tag: str,
    headlines: list[str],
) -> tuple[str, str, str]:
    """
    Build category id + labels from the story tag and headline vocabulary.
    IPL and other cricket stories map to the shared cricket category.
    Returns (category_id, label_en, label_hi).
    """
    if is_cricket_content(tag, headlines):
        meta = _CATEGORY_LABEL_CACHE[CRICKET_ID]
        return CRICKET_ID, meta["label_en"], meta["label_hi"]

    blob = f"{tag} {' '.join(headlines)}".lower()
    tokens = [
        w
        for w in re.findall(r"[\w\u0900-\u097F]+", blob)
        if len(w) >= 3 and w not in _TAG_STOPWORDS and not is_weak_merge_token(w)
    ]

    if not tokens:
        label_en = tag[:48] if tag else "Trending"
        cat_id = _slugify(label_en)
        label_hi = transliterate_topic(label_en)
        return cat_id, label_en, label_hi

    theme_word = Counter(tokens).most_common(1)[0][0]
    cat_id = _slugify(theme_word)

    # Never expose ipl as its own category — cricket umbrella handles it
    if cat_id == "ipl" or is_cricket_content(theme_word, headlines):
        meta = _CATEGORY_LABEL_CACHE[CRICKET_ID]
        return CRICKET_ID, meta["label_en"], meta["label_hi"]

    label_en = tag if tag else theme_word.title()
    label_hi = transliterate_topic(label_en)

    _CATEGORY_LABEL_CACHE[cat_id] = {"label_hi": label_hi, "label_en": label_en}
    return cat_id, label_en, label_hi


class ScoredTrendDraft:
    __slots__ = (
        "topic",
        "category",
        "category_label_en",
        "category_label_hi",
        "misc_rank",
        "heat",
        "boost_reasons",
        "google_rank",
        "x_rank",
        "rss_count",
        "x_mentions",
        "rss_sources",
        "google_score",
        "x_score",
        "latest_seen",
        "headlines",
        "articles",
        "view_count",
        "india_reach_pct",
    )

    def __init__(
        self,
        topic: str,
        category: str,
        category_label_en: str,
        category_label_hi: str,
        heat: float,
        boost_reasons: list[str],
        google_rank: int | None,
        x_rank: int | None,
        rss_count: int,
        x_mentions: int,
        rss_sources: list[str],
        google_score: float,
        x_score: float,
        latest_seen,
        headlines: list[str],
        view_count: int,
        india_reach_pct: float,
        articles: list[dict[str, str]] | None = None,
    ):
        self.topic = topic
        self.category = category
        self.category_label_en = category_label_en
        self.category_label_hi = category_label_hi
        self.misc_rank = None
        self.heat = heat
        self.boost_reasons = boost_reasons
        self.google_rank = google_rank
        self.x_rank = x_rank
        self.rss_count = rss_count
        self.x_mentions = x_mentions
        self.rss_sources = rss_sources
        self.google_score = google_score
        self.x_score = x_score
        self.latest_seen = latest_seen
        self.headlines = headlines
        self.articles = articles or []
        self.view_count = view_count
        self.india_reach_pct = india_reach_pct


def get_category_meta(category_id: str) -> dict[str, str]:
    cached = _CATEGORY_LABEL_CACHE.get(category_id)
    if cached:
        return cached
    readable = category_id.replace("_", " ").strip().title()
    return {"label_hi": transliterate_topic(readable), "label_en": readable}


def _rollup_category_id(cat_id: str, trend: Any) -> str:
    """Merge legacy ipl pills into cricket."""
    if cat_id == "ipl":
        return CRICKET_ID
    topic = getattr(trend, "topic", None) or trend.get("topic", "")
    tag = getattr(trend, "hashtag", None) or trend.get("hashtag", "")
    if is_cricket_content(f"{topic} {tag}", None):
        return CRICKET_ID
    return cat_id


def build_category_list_from_trends(trends: list[Any]) -> list[dict[str, Any]]:
    """UI pills from live trends — labels taken from each trend's derived category."""
    counts: dict[str, int] = {}
    labels: dict[str, dict[str, str]] = {}

    for t in trends:
        cat = getattr(t, "category", None) or t.get("category")
        if not cat or str(cat) == ALL_ID:
            continue
        cat = _rollup_category_id(str(cat), t)
        counts[cat] = counts.get(cat, 0) + 1
        if cat not in labels:
            labels[cat] = {
                "label_hi": getattr(t, "category_label_hi", None)
                or t.get("category_label_hi")
                or get_category_meta(cat)["label_hi"],
                "label_en": getattr(t, "category_label_en", None)
                or t.get("category_label_en")
                or get_category_meta(cat)["label_en"],
            }

    if not counts:
        return []

    sorted_ids = sorted(counts.keys(), key=lambda c: -counts[c])

    result: list[dict[str, Any]] = [
        {
            "id": ALL_ID,
            "label_hi": "सभी",
            "label_en": "All",
            "count": len(trends),
        }
    ]
    for cat_id in sorted_ids:
        meta = labels[cat_id]
        result.append(
            {
                "id": cat_id,
                "label_hi": meta["label_hi"],
                "label_en": meta["label_en"],
                "count": counts[cat_id],
            }
        )
    return result
