"""Match headlines and articles to a canonical trend topic."""

from __future__ import annotations

import re

from rapidfuzz import fuzz

_YEAR_TOKEN = re.compile(r"^20\d{2}$")
_STOP = frozenset(
    "the and for with from this that about into your their have will been were are was".split()
)


def _normalize(text: str) -> str:
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def strong_topic_tokens(topic: str) -> set[str]:
    """Meaningful tokens for relevance (years and stopwords excluded)."""
    tokens: set[str] = set()
    for raw in _normalize(topic).split():
        if len(raw) < 3 or raw in _STOP or _YEAR_TOKEN.match(raw) or raw.isdigit():
            continue
        tokens.add(raw)
    return tokens


def is_weak_merge_token(token: str) -> bool:
    return bool(_YEAR_TOKEN.match(token)) or token.isdigit() or len(token) < 3


def is_text_relevant_to_topic(topic: str, text: str, *, min_fuzzy: int = 72) -> bool:
    """True when text plausibly refers to the same story as topic."""
    if not text or not topic:
        return False

    topic_norm = _normalize(topic)
    text_norm = _normalize(text)
    if not topic_norm or not text_norm:
        return False

    if topic_norm in text_norm or text_norm in topic_norm:
        return True

    strong = strong_topic_tokens(topic)
    if not strong:
        return fuzz.token_set_ratio(topic_norm, text_norm) >= min_fuzzy

    hits = sum(1 for t in strong if re.search(rf"\b{re.escape(t)}\b", text_norm))
    if hits == 0:
        return False
    if hits >= min(2, len(strong)):
        return True
    if len(strong) == 1:
        return True
    return fuzz.partial_ratio(topic_norm, text_norm) >= min_fuzzy


def filter_headlines_for_topic(topic: str, headlines: list[str]) -> list[str]:
    return [h for h in headlines if is_text_relevant_to_topic(topic, h)]


def filter_articles_for_topic(
    topic: str, articles: list[dict[str, str]]
) -> list[dict[str, str]]:
    matched: list[dict[str, str]] = []
    for item in articles:
        title = item.get("title", "") or ""
        if is_text_relevant_to_topic(topic, title):
            matched.append(item)
    return matched


def pick_best_headline(topic: str, headlines: list[str]) -> str | None:
    relevant = filter_headlines_for_topic(topic, headlines)
    if not relevant:
        return None
    topic_norm = _normalize(topic)
    return max(
        relevant,
        key=lambda h: fuzz.token_set_ratio(topic_norm, _normalize(h)),
    )
