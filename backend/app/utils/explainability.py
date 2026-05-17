"""Hindi explainability copy and momentum channel metrics for trend detail UI."""

from __future__ import annotations

from datetime import datetime

from app.utils.hindi import display_topic, pick_best_headline
from app.utils.state_heatmap import derive_momentum
from app.utils.states_hi import detect_state_codes, hindi_state_name

MomentumDirection = str  # rising | stable | falling
FreshnessTier = str  # live | recent | today | aging


def freshness_meta(minutes_ago: int) -> tuple[FreshnessTier, str, str]:
    """tier, label_hi, label_en"""
    if minutes_ago < 30:
        return "live", "लाइव — अभी अपडेट", "Live — just updated"
    if minutes_ago < 180:
        return "recent", "हाल की खबर", "Recent coverage"
    if minutes_ago < 1440:
        return "today", "आज की चर्चा", "Trending today"
    return "aging", "पिछले कुछ दिनों की खबर", "From the past few days"


def _rank_strength(rank: int | None, max_rank: int = 25) -> float:
    if rank is None:
        return 18.0
    return max(12.0, min(100.0, (max_rank - rank + 1) * 4.2))


def _rank_direction(rank: int | None) -> MomentumDirection:
    if rank is None:
        return "stable"
    if rank <= 5:
        return "rising"
    if rank >= 15:
        return "falling"
    return "stable"


def build_momentum_channels(
    google_rank: int | None,
    x_rank: int | None,
    rss_count: int,
    google_score: float,
    x_score: float,
) -> list[dict[str, str | float]]:
    channels: list[dict[str, str | float]] = []

    if google_rank is not None or google_score > 0:
        channels.append(
            {
                "key": "google",
                "label_hi": "गूगल ट्रेंड्स",
                "label_en": "Google Trends",
                "strength": round(_rank_strength(google_rank) * (0.85 + google_score * 0.15), 1),
                "direction": _rank_direction(google_rank),
                "detail_hi": (
                    f"भारत में रैंक #{google_rank}"
                    if google_rank is not None
                    else "खोज में मजबूत सिग्नल"
                ),
            }
        )

    if x_rank is not None or x_score > 0:
        channels.append(
            {
                "key": "x",
                "label_hi": "एक्स (ट्विटर)",
                "label_en": "X",
                "strength": round(_rank_strength(x_rank) * (0.8 + x_score * 0.2), 1),
                "direction": _rank_direction(x_rank),
                "detail_hi": (
                    f"ट्रेंडिंग लिस्ट में #{x_rank}"
                    if x_rank is not None
                    else "सोशल चर्चा बढ़ रही है"
                ),
            }
        )

    if rss_count > 0:
        strength = min(100.0, 22.0 + rss_count * 18.0)
        direction: MomentumDirection = "rising" if rss_count >= 3 else "stable"
        channels.append(
            {
                "key": "news",
                "label_hi": "भारतीय न्यूज़",
                "label_en": "News RSS",
                "strength": round(strength, 1),
                "direction": direction,
                "detail_hi": f"{rss_count} हालिया हेडलाइन",
            }
        )

    if not channels:
        channels.append(
            {
                "key": "aggregate",
                "label_hi": "संयुक्त सिग्नल",
                "label_en": "Combined",
                "strength": 40.0,
                "direction": "stable",
                "detail_hi": "कई स्रोतों से मिला संकेत",
            }
        )

    return channels


def build_why_rising(
    topic: str,
    momentum: str,
    google_rank: int | None,
    x_rank: int | None,
    rss_count: int,
    headlines: list[str] | None = None,
) -> str:
    display = display_topic(topic)
    parts: list[str] = []

    if momentum == "rising":
        parts.append(f"「{display}」अभी तेजी से ऊपर जा रहा है")
        if google_rank is not None and google_rank <= 10:
            parts.append(f"गूगल ट्रेंड्स भारत में टॉप {google_rank} के आसपास है")
        if x_rank is not None and x_rank <= 10:
            parts.append(f"एक्स पर भी टॉप {x_rank} के करीब ट्रेंड कर रहा है")
        if rss_count >= 2:
            parts.append("कई न्यूज़ आउटलेट एक साथ रिपोर्ट कर रहे हैं")
    elif momentum == "falling":
        parts.append(f"「{display}」की गति धीमी हो रही है")
        if google_rank is not None and google_rank >= 12:
            parts.append(f"गूगल रैंक #{google_rank} पर स्थिर/नीचे की ओर")
        parts.append("पहले की तुलना में नए हेडलाइन कम आ रहे हैं")
    else:
        parts.append(f"「{display}」स्थिर रूप से चर्चा में बना हुआ है")
        if google_rank is not None:
            parts.append(f"गूगल पर मध्यम रैंक (#{google_rank}) बनाए हुए है")
        if rss_count >= 1:
            parts.append("न्यूज़ फीड में नियमित कवरेज जारी है")

    snippet = pick_best_headline(topic, headlines or [])
    if snippet and momentum == "rising":
        parts.append(f"ताज़ा ट्रिगर: '{snippet[:90]}'")

    return "। ".join(parts) + "।"


def build_local_relevance(
    topic: str,
    india_reach_pct: float,
    headlines: list[str] | None = None,
) -> str:
    display = display_topic(topic)
    blob = " ".join([topic, *(headlines or [])[:10]])
    codes = sorted(detect_state_codes(blob))[:4]
    state_names = [hindi_state_name(c) for c in codes]

    parts = [
        f"अनुमानित {india_reach_pct:.1f}% भारतीय आबादी "
        f"डिजिटल स्रोतों पर इस विषय तक पहुँच रही है",
    ]

    if state_names:
        joined = ", ".join(state_names)
        parts.append(f"खबरों में {joined} जैसे राज्य/क्षेत्र सबसे अधिक जुड़े दिख रहे हैं")
    else:
        parts.append(
            "यह राष्ट्रीय स्तर पर चर्चा है — विशेष रूप से महानगरों और "
            "हिंदी-भाषी फीड में दिख रहा है"
        )

    parts.append(f"「{display}」भारत-केंद्रित ट्रेंड के रूप में रैंक किया गया है")
    return "। ".join(parts) + "।"


def build_explainability(
    topic: str,
    india_reach_pct: float,
    google_rank: int | None,
    x_rank: int | None,
    rss_count: int,
    rss_sources: list[str],
    google_score: float,
    x_score: float,
    latest_seen: datetime | None,
    headlines: list[str] | None = None,
) -> dict:
    minutes = 30
    if latest_seen is not None:
        from datetime import timezone

        now = datetime.now(timezone.utc)
        seen = latest_seen
        if seen.tzinfo is None:
            seen = seen.replace(tzinfo=timezone.utc)
        minutes = max(1, int((now - seen).total_seconds() / 60))

    tier, label_hi, label_en = freshness_meta(minutes)
    momentum = derive_momentum(google_rank, x_rank)

    return {
        "why_rising": build_why_rising(
            topic, momentum, google_rank, x_rank, rss_count, headlines
        ),
        "local_relevance": build_local_relevance(topic, india_reach_pct, headlines),
        "freshness_tier": tier,
        "freshness_label_hi": label_hi,
        "freshness_label_en": label_en,
        "updated_minutes_ago": minutes,
        "momentum_channels": build_momentum_channels(
            google_rank, x_rank, rss_count, google_score, x_score
        ),
        "rss_source_names": rss_sources[:6],
    }
