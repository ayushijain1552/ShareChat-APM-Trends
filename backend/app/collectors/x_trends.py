"""X (formerly Twitter) India trends — official API if configured, else public fallback."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.request import Request, urlopen

from app.utils.models import RawSignal

logger = logging.getLogger(__name__)

INDIA_WOEID = 23424848
_USER_AGENT = "ShareChatTrendBot/1.0 (APM assignment)"


def _http_get(url: str, headers: dict[str, str] | None = None, timeout: int = 12) -> str:
    req = Request(url, headers={"User-Agent": _USER_AGENT, **(headers or {})})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _fetch_official_api(bearer: str, limit: int) -> list[RawSignal]:
    url = f"https://api.twitter.com/1.1/trends/place.json?id={INDIA_WOEID}"
    body = _http_get(url, headers={"Authorization": f"Bearer {bearer}"})
    data = json.loads(body)
    trends = data[0].get("trends", []) if data else []
    now = datetime.now(timezone.utc)
    signals: list[RawSignal] = []
    for rank, row in enumerate(trends[:limit], start=1):
        name = (row.get("name") or "").lstrip("#").strip()
        if len(name) < 2:
            continue
        tweet_volume = row.get("tweet_volume") or 0
        signals.append(
            RawSignal(
                topic=name,
                source="x",
                latest_seen=now,
                metadata={"x_rank": rank, "x_volume": tweet_volume, "geo": "IN"},
            )
        )
    return signals


def _fetch_trends24_fallback(limit: int) -> list[RawSignal]:
    """Scrape India trends page when X API token is not set (demo-friendly)."""
    html = _http_get("https://trends24.in/india/")
    # Trend links in page body
    names = re.findall(r'<a[^>]+class="trend-link"[^>]*>([^<]+)</a>', html, re.I)
    if not names:
        names = re.findall(r'data-trend="([^"]+)"', html)
    now = datetime.now(timezone.utc)
    signals: list[RawSignal] = []
    seen: set[str] = set()
    rank = 0
    for raw in names:
        name = re.sub(r"[^\w\s\u0900-\u097F#]", "", raw).lstrip("#").strip()
        key = name.lower()
        if len(name) < 2 or key in seen:
            continue
        seen.add(key)
        rank += 1
        signals.append(
            RawSignal(
                topic=name,
                source="x",
                latest_seen=now,
                metadata={"x_rank": rank, "x_volume": max(1, 50 - rank) * 1000},
            )
        )
        if rank >= limit:
            break
    return signals


def fetch_x_trends_signals(limit: int = 25) -> list[RawSignal]:
    bearer = os.getenv("X_BEARER_TOKEN") or os.getenv("TWITTER_BEARER_TOKEN")
    try:
        if bearer:
            signals = _fetch_official_api(bearer, limit)
            if signals:
                return signals
        signals = _fetch_trends24_fallback(limit)
        if signals:
            logger.info("X trends loaded via trends24 fallback (%d items)", len(signals))
        return signals
    except (URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.warning("X trends fetch failed: %s", exc)
        return []
