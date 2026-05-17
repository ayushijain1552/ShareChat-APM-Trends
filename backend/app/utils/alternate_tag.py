"""Alternate tags when multiple stories share the same hashtag — events > teams > players."""

from __future__ import annotations

import re
from typing import Literal

from app.utils.hindi import build_hashtag
from app.utils.tag_extraction import (
    _format_tag,
    _lead_from_headline,
    _score_candidates,
    extract_cluster_tag,
)

EntityKind = Literal["event", "team", "player"]

# Longer phrases first for greedy matching
_EVENT_PHRASES: tuple[str, ...] = (
    "ipl player auction",
    "ipl mega auction",
    "ipl auction",
    "player auction",
    "mega auction",
    "t20 world cup",
    "world cup final",
    "asia cup final",
    "champions trophy",
    "semi final",
    "quarter final",
    "super over",
    "opening match",
    "opening ceremony",
    "union budget",
    "interim budget",
    "exit poll",
    "vote count",
    "election results",
    "press conference",
    "match day",
    "final match",
    "world cup",
    "asia cup",
    "budget session",
    "railway budget",
)

_TEAM_PHRASES: tuple[str, ...] = (
    "chennai super kings",
    "royal challengers bangalore",
    "kolkata knight riders",
    "sunrisers hyderabad",
    "lucknow super giants",
    "mumbai indians",
    "delhi capitals",
    "punjab kings",
    "rajasthan royals",
    "gujarat titans",
    "royal challengers",
    "super kings",
    "knight riders",
    "new zealand",
    "south africa",
    "west indies",
    "srh",
    "rcb",
    "csk",
    "mi",
    "kkr",
    "dc",
    "pbks",
    "rr",
    "gt",
    "lsg",
    "india",
    "australia",
    "england",
    "pakistan",
)

_PLAYER_PHRASES: tuple[str, ...] = (
    "virat kohli",
    "rohit sharma",
    "ms dhoni",
    "hardik pandya",
    "jasprit bumrah",
    "kl rahul",
    "shubman gill",
    "ravindra jadeja",
    "rinku singh",
    "suryakumar yadav",
    "mohammed shami",
    "yashasvi jaiswal",
    "rishabh pant",
    "kohli",
    "rohit",
    "dhoni",
    "bumrah",
    "gill",
    "jadeja",
    "pant",
    "shami",
    "rahul",
    "hardik",
)

_KIND_PHRASES: dict[EntityKind, tuple[str, ...]] = {
    "event": _EVENT_PHRASES,
    "team": _TEAM_PHRASES,
    "player": _PLAYER_PHRASES,
}

_PRIORITY: tuple[EntityKind, ...] = ("event", "team", "player")


def hashtag_key(topic_or_tag: str) -> str:
    text = (topic_or_tag or "").strip()
    if not text.startswith("#"):
        text = build_hashtag(text)
    return text.lower().lstrip("#")


def _headline_hits(phrase: str, headlines: list[str]) -> int:
    needle = phrase.lower()
    return sum(1 for h in headlines if needle in h.lower())


def _find_entities(headlines: list[str], kind: EntityKind) -> list[str]:
    if not headlines:
        return []
    blob = " ".join(headlines).lower()
    found: list[str] = []
    seen: set[str] = set()
    for phrase in _KIND_PHRASES[kind]:
        if phrase in blob and phrase not in seen:
            seen.add(phrase)
            found.append(phrase)
    found.sort(key=lambda p: -_headline_hits(p, headlines))
    return found


def extract_alternate_tag(
    headlines: list[str],
    primary_topic: str,
    used_hashtag_keys: set[str],
) -> str | None:
    """
    Pick an alternate display tag from headlines, prioritising events, then teams, then players.
    """
    used = {k for k in used_hashtag_keys if k}
    primary_key = hashtag_key(primary_topic)
    used.add(primary_key)
    primary_lower = primary_topic.lower().strip()

    for kind in _PRIORITY:
        for phrase in _find_entities(headlines, kind):
            tag = _format_tag(phrase)
            key = hashtag_key(tag)
            if key in used:
                continue
            if tag.lower() == primary_lower:
                continue
            return tag

    ranked = _score_candidates(headlines)
    for phrase, _score in ranked.most_common(40):
        tag = _format_tag(phrase)
        key = hashtag_key(tag)
        if key in used:
            continue
        if phrase.lower() in primary_lower or primary_lower in phrase.lower():
            continue
        return tag

    if headlines:
        lead = _lead_from_headline(headlines[0])
        key = hashtag_key(lead)
        if key not in used and lead.lower() != primary_lower:
            return lead

    seed = extract_cluster_tag(headlines, fallback="")
    if seed:
        key = hashtag_key(seed)
        if key not in used and seed.lower() != primary_lower:
            return seed

    return None


def assign_unique_topics(drafts: list) -> list:
    """
    Mutate draft.topic so lower-ranked items with duplicate hashtags get alternates.
    `drafts` is a list of (heat, ScoredTrendDraft) sorted by heat descending.
    """
    from app.normalization.categories import derive_category_from_content

    used_keys: set[str] = set()

    for _heat, draft in drafts:
        key = hashtag_key(draft.topic)
        if key not in used_keys:
            used_keys.add(key)
            continue

        alt = extract_alternate_tag(draft.headlines, draft.topic, used_keys)
        if alt:
            draft.topic = alt
            key = hashtag_key(alt)

        if key in used_keys:
            # Last resort: disambiguate with a short headline fragment
            for phrase, _ in _score_candidates(draft.headlines).most_common(15):
                tag = _format_tag(phrase)
                candidate_key = hashtag_key(tag)
                if candidate_key not in used_keys:
                    draft.topic = tag
                    key = candidate_key
                    break

        used_keys.add(key)
        cat_id, label_en, label_hi = derive_category_from_content(draft.topic, draft.headlines)
        draft.category = cat_id
        draft.category_label_en = label_en
        draft.category_label_hi = label_hi

    return drafts
