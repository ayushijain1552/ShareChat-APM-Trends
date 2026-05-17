"""Extract ShareChat-style tags from clustered headlines (not category keywords)."""

from __future__ import annotations

import re
from collections import Counter

from app.utils.topic_match import is_weak_merge_token

_TAG_STOPWORDS = frozenset(
    """
    the and for with from this that about into your their have will been were are was
    says said after before when what how why who new latest update breaking live just
    india indian bharat today tomorrow yesterday here there all out top best more also
    news report reports according sources source official officials minister government
    """.split()
)

_GENERIC_PHRASES = frozenset(
    {
        "india news",
        "top news",
        "breaking news",
        "latest news",
        "big news",
        "news update",
        "full story",
        "read more",
    }
)

# Seasonal Google noise — never publish without matching headlines
SEASONAL_NOISE = frozenset(
    {
        "diwali",
        "deepavali",
        "holi",
        "navratri",
        "christmas",
        "eid",
        "pongal",
        "onam",
    }
)

_ACRONYM_RE = re.compile(r"\b[A-Z]{2,}[A-Z0-9]{0,6}\b")
_YEAR_RE = re.compile(r"\b20\d{2}\b")


def _normalize_text(text: str) -> str:
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def _headline_words(headline: str) -> list[str]:
    words: list[str] = []
    for raw in _normalize_text(headline).split():
        if raw in _TAG_STOPWORDS or is_weak_merge_token(raw):
            continue
        if len(raw) < 2:
            continue
        words.append(raw)
    return words


def _is_valid_tag_phrase(phrase: str) -> bool:
    if phrase in _GENERIC_PHRASES:
        return False
    parts = phrase.split()
    if not parts or len(parts) > 5:
        return False
    if all(is_weak_merge_token(p) for p in parts):
        return False
    return len(phrase) >= 4


def _score_candidates(headlines: list[str]) -> Counter[str]:
    scores: Counter[str] = Counter()

    for headline in headlines:
        lower = headline.lower()
        words = _headline_words(headline)

        for match in _ACRONYM_RE.finditer(headline):
            token = match.group(0).lower()
            if len(token) >= 3:
                scores[token] += 5

        for n in (2, 3, 4):
            for i in range(len(words) - n + 1):
                phrase = " ".join(words[i : i + n])
                if not _is_valid_tag_phrase(phrase):
                    continue
                weight = n + sum(1 for h in headlines if phrase in h.lower())
                scores[phrase] += weight

        year = _YEAR_RE.search(headline)
        if year and words:
            anchor = words[0]
            if len(anchor) >= 3:
                scores[f"{anchor} {year.group(0)}"] += 4

    return scores


def _format_tag(phrase: str) -> str:
    if phrase.isupper() or re.match(r"^[a-z0-9]+$", phrase) and len(phrase) <= 6:
        return phrase.upper()
    return " ".join(p.capitalize() if p.isascii() else p for p in phrase.split())


def _lead_from_headline(headline: str, max_words: int = 4) -> str:
    words = _headline_words(headline)
    if not words:
        return headline.strip()[:48]
    chunk = words[:max_words]
    return _format_tag(" ".join(chunk))


def is_seasonal_noise(term: str) -> bool:
    text = _normalize_text(term)
    if not text:
        return False
    if text in SEASONAL_NOISE:
        return True
    return any(noise in text.split() for noise in SEASONAL_NOISE)


def cluster_has_news_evidence(cluster: dict) -> bool:
    """True when RSS headlines or X mentions corroborate the story."""
    if cluster.get("headlines"):
        return True
    if cluster.get("rss_count", 0) > 0:
        return True
    if cluster.get("x_mentions", 0) > 0:
        return True
    return False


def should_publish_cluster(cluster: dict) -> bool:
    """
    Drop Google-only seasonal placeholders (e.g. demo-list Diwali with zero news).
    """
    if cluster_has_news_evidence(cluster):
        return True
    if cluster.get("google_rank") is None:
        return False
    seed = cluster.get("google_topic") or cluster.get("topic") or ""
    if is_seasonal_noise(seed):
        return False
    return True


def extract_cluster_tag(headlines: list[str], fallback: str) -> str | None:
    """
    Pick the dominant story tag from clustered headlines.
    Returns None when only a seasonal Google label exists with no news match.
    """
    fallback = (fallback or "").strip()
    blob = " ".join(headlines).lower()

    if headlines:
        ranked = _score_candidates(headlines)
        if ranked:
            best_phrase, _ = ranked.most_common(1)[0]
            tag = _format_tag(best_phrase)

            if fallback:
                fb = fallback.lower()
                if fb in SEASONAL_NOISE and fb not in blob:
                    return tag
                if fb not in blob and tag.lower() in blob:
                    return tag

            return tag

        return _lead_from_headline(headlines[0])

    if not fallback:
        return None

    fb = fallback.lower()
    if fb in SEASONAL_NOISE or is_seasonal_noise(fallback):
        return None

    return _format_tag(fallback)
