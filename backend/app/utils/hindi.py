"""Rule-based Hindi copy — article summaries and population reach context."""

from __future__ import annotations

import re

from app.utils.acronym_hi import is_acronym_token, transliterate_acronym
from app.utils.states_hi import state_hi_for_token, translate_states_in_text
from app.utils.topic_match import pick_best_headline
from app.utils.translit import roman_to_devanagari

_TRANSLIT: dict[str, str] = {
    "cricket": "क्रिकेट",
    "ipl": "आईपीएल",
    "diwali": "दीवाली",
    "deepavali": "दीवाली",
    "bollywood": "बॉलीवुड",
    "election": "चुनाव",
    "modi": "मोदी",
    "rain": "बारिश",
    "weather": "मौसम",
    "mumbai": "मुंबई",
    "delhi": "दिल्ली",
    "india": "भारत",
    "netflix": "नेटफ्लिक्स",
    "hotstar": "हॉटस्टार",
}


def _transliterate_token(word: str) -> str:
    lower = word.lower().strip()
    if lower in _TRANSLIT:
        return _TRANSLIT[lower]
    state_hi = state_hi_for_token(word)
    if state_hi:
        return state_hi
    if re.search(r"[\u0900-\u097F]", word):
        return word
    return roman_to_devanagari(lower)


def transliterate_topic(topic: str) -> str:
    """Topic → Hindi; multi-word state names matched before token split."""
    tokens = re.split(r"[\s\-_/]+", topic.strip())
    parts: list[str] = []
    for token in tokens:
        if not token:
            continue
        if re.fullmatch(r"20\d{2}", token):
            parts.append(token)
        elif is_acronym_token(token):
            parts.append(transliterate_acronym(token))
        else:
            parts.append(_transliterate_token(token))
    result = " ".join(parts) if parts else topic
    return translate_states_in_text(result)


def display_topic(topic: str) -> str:
    """Canonical Hindi display string for topic, hashtag, and copy."""
    return transliterate_topic(topic)


def build_hashtag(topic: str) -> str:
    """Hashtag derived from the same display form used in hindi_description."""
    display = display_topic(topic)
    clean = re.sub(r"[\s\-_]+", "", display)
    clean = re.sub(r"[^\w\u0900-\u097F]", "", clean)
    if not clean:
        clean = re.sub(r"[^\w\u0900-\u097F]", "", roman_to_devanagari(topic.replace(" ", "")))
    base = clean[:40] if clean else "ट्रेंडिंगभारत"
    return f"#{base}" if not base.startswith("#") else base


def _truncate(text: str, max_len: int) -> str:
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def _summarize_headlines(headlines: list[str], max_items: int = 3) -> list[str]:
    seen: set[str] = set()
    bullets: list[str] = []
    for raw in headlines:
        line = _truncate(raw, 85)
        key = line.lower()
        if key in seen:
            continue
        seen.add(key)
        bullets.append(line)
        if len(bullets) >= max_items:
            break
    return bullets


def hindi_description(
    topic: str,
    headlines: list[str] | None = None,
    articles: list[dict[str, str]] | None = None,
) -> str:
    """Hindi summary synthesizing clustered news headlines."""
    display = display_topic(topic)
    bullets = _summarize_headlines(headlines or [])

    if not bullets and articles:
        bullets = [
            _truncate(a.get("title", ""), 85)
            for a in articles[:3]
            if a.get("title")
        ]

    if bullets:
        if len(bullets) == 1:
            return translate_states_in_text(
                f"「{display}」— समाचार सार: {bullets[0]}। "
                f"यह कहानी भारतीय न्यूज़ और सोशल फीड पर तेज़ी से फैल रही है।"
            )
        joined = " • ".join(bullets)
        return translate_states_in_text(f"「{display}」— समाचार सार: {joined}।")

    return translate_states_in_text(
        f"「{display}」— गूगल ट्रेंड्स, एक्स और भारतीय न्यूज़ फीड पर "
        f"यह विषय अभी चर्चा में है।"
    )


def format_boost_reasons_hindi(reasons: list[str]) -> str:
    return ""


def why_trending(
    topic: str,
    india_reach_pct: float,
    google_rank: int | None,
    x_rank: int | None,
    rss_count: int,
    rss_sources: list[str],
    headlines: list[str] | None = None,
) -> str:
    """Why trending — leads with estimated % of Indian population reached."""
    display = display_topic(topic)
    pct_text = f"{india_reach_pct:.1f}"
    reasons: list[str] = [
        f"अनुमानित {pct_text}% भारतीय आबादी इस विषय से जुड़े "
        f"गूगल, एक्स और न्यूज़ स्रोतों तक पहुँच रही है",
    ]

    snippet = pick_best_headline(topic, headlines or [])
    if snippet:
        reasons.append(f"मुख्य खबर: '{_truncate(snippet, 100)}'")

    channels: list[str] = []
    if google_rank is not None:
        channels.append("गूगल ट्रेंड्स")
    if x_rank is not None:
        channels.append("एक्स (ट्विटर)")
    if rss_count > 0:
        channels.append("भारतीय न्यूज़ आउटलेट")
    if channels:
        reasons.append(f"स्रोत: {', '.join(channels)}")

    if rss_count >= 3:
        reasons.append("कई समाचार संस्थान एक ही दिन में इस पर रिपोर्ट कर रहे हैं")

    return translate_states_in_text(
        f"「{display}」ट्रेंडिंग है क्योंकि {'; '.join(reasons)}।"
    )


def why_trending_misc(
    topic: str,
    india_reach_pct: float,
    headlines: list[str] | None = None,
) -> str:
    display = display_topic(topic)
    pct_text = f"{india_reach_pct:.1f}"
    reasons = [
        f"अनुमानित {pct_text}% भारतीय आबादी इस उभरते विषय तक पहुँच रही है",
        "यह अभी कई अलग फीड पर एक साथ दिख रहा है",
    ]
    snippet = pick_best_headline(topic, headlines or [])
    if snippet:
        reasons.append(f"खबरों का केंद्र: '{_truncate(snippet, 100)}'")
    return translate_states_in_text(f"「{display}」— {'; '.join(reasons)}।")
