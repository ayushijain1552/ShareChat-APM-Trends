"""Heuristic boosts tuned for Indian audience interests (ShareChat context)."""

from __future__ import annotations

import re

_FESTIVAL = re.compile(
    r"\b(diwali|deepavali|holi|navratri|eid|christmas|pongal|onam|dussehra)\b",
    re.I,
)
_IPL = re.compile(r"\bipl\b", re.I)
_CRICKET = re.compile(
    r"\b(cricket|t20|twenty20|odi|test|kohli|rohit|dhoni|bcci|wicket|stadium)\b", re.I
)
_BOLLYWOOD = re.compile(
    r"\b(bollywood|movie|film|song|trailer|celebrity)\b", re.I
)
_ACTOR = re.compile(
    r"\b(actor|actress|hero|heroine|srk|shah rukh|salman|amitabh|deepika|"
    r"ranveer|alia|kartik|kriti|rajini|rajinikanth|vijay|nawazuddin)\b",
    re.I,
)
_DEVOTIONAL = re.compile(
    r"\b(temple|mandir|puja|aarti|bhajan|prayer|ram mandir|shiva|krishna)\b", re.I
)
_INDIAN_CITIES = re.compile(
    r"\b(mumbai|delhi|bangalore|bengaluru|chennai|kolkata|hyderabad|pune|ahmedabad|jaipur)\b",
    re.I,
)
_OTT_PLATFORM = re.compile(
    r"\b(netflix|hotstar|disney\+?\s*hotstar|jio\s*cinema|jiocinema|"
    r"amazon\s*prime|prime\s*video|zee5|sony\s*liv|sonyliv|voot|mx\s*player|apple\s*tv)\b",
    re.I,
)
_OTT_SERIES = re.compile(
    r"\b(web\s*series|webseries|season\s*\d+|new\s+season|binge|"
    r"episode|series\s+finale|streaming\s+release)\b",
    re.I,
)

BOOST_IPL = 0.14
BOOST_CRICKET = 0.10
BOOST_BOLLYWOOD = 0.10
BOOST_ACTOR = 0.09
BOOST_OTT_SERIES = 0.09
BOOST_FESTIVAL = 0.10
BOOST_DEVOTIONAL = 0.08
BOOST_CITY = 0.05
MAX_BOOST = 0.30


def apply_heuristic_boosts(
    topic: str,
    base_score: float,
) -> tuple[float, list[str]]:
    text = topic.lower()
    boost = 0.0
    reasons: list[str] = []

    fest = _FESTIVAL.search(text)
    if fest:
        boost += BOOST_FESTIVAL
        reasons.append(f"festival:{fest.group(0)}")

    if _IPL.search(text):
        boost += BOOST_IPL
        reasons.append("IPL boost (cricket)")
    elif _CRICKET.search(text):
        boost += BOOST_CRICKET
        reasons.append("cricket boost")
    if _BOLLYWOOD.search(text):
        boost += BOOST_BOLLYWOOD
        reasons.append("Bollywood boost")
    if _ACTOR.search(text):
        boost += BOOST_ACTOR
        reasons.append("actor boost")
    if _OTT_PLATFORM.search(text) or _OTT_SERIES.search(text):
        boost += BOOST_OTT_SERIES
        reasons.append("OTT series boost")
    if _DEVOTIONAL.search(text) and not fest:
        boost += BOOST_DEVOTIONAL
        reasons.append("devotional boost")
    if _INDIAN_CITIES.search(text):
        boost += BOOST_CITY
        reasons.append("Indian city relevance")

    boost = min(boost, MAX_BOOST)
    return min(base_score + boost, 1.0), reasons
