"""Google Trends India collector via pytrends (unofficial API)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.utils.models import RawSignal

logger = logging.getLogger(__name__)

def _terms_from_dataframe(df, limit: int) -> list[str]:
    if df is None or df.empty:
        return []
    return df.iloc[:, 0].astype(str).tolist()[:limit]


def _fetch_terms(pytrends, limit: int) -> list[str]:
    """Try multiple pytrends endpoints; Google changes URLs and some break intermittently."""
    fetchers = [
        lambda: pytrends.trending_searches(pn="india"),
        lambda: pytrends.today_searches(pn="IN"),
        lambda: pytrends.realtime_trending_searches(pn="IN"),
    ]
    for fetch in fetchers:
        try:
            terms = _terms_from_dataframe(fetch(), limit)
            if terms:
                return terms
        except Exception:
            continue
    return []


def fetch_google_trends_signals(limit: int = 25) -> list[RawSignal]:
    signals: list[RawSignal] = []
    try:
        from pytrends.request import TrendReq

        # hl=hi-IN + tz=330 (IST) aligns with Hindi-speaking Indian audience
        pytrends = TrendReq(hl="hi-IN", tz=330, timeout=(5, 15))
        terms = _fetch_terms(pytrends, limit)
        if not terms:
            logger.info("Google Trends scrape returned no terms; relying on RSS/X only")

        now = datetime.now(timezone.utc)
        for rank, term in enumerate(terms, start=1):
            term = term.strip()
            if not term or len(term) < 2:
                continue
            signals.append(
                RawSignal(
                    topic=term,
                    source="google_trends",
                    google_rank=rank,
                    latest_seen=now,
                    metadata={"geo": "IN"},
                )
            )
    except Exception as exc:
        logger.warning("Google Trends fetch failed: %s", exc)
    return signals
