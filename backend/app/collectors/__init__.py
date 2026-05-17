"""Data collectors for external trend signals."""

from app.collectors.google_trends import fetch_google_trends_signals
from app.collectors.rss import fetch_rss_signals
from app.collectors.x_trends import fetch_x_trends_signals

__all__ = [
    "fetch_google_trends_signals",
    "fetch_rss_signals",
    "fetch_x_trends_signals",
]
