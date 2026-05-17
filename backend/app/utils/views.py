"""Heuristic view counts — ShareChat-style engagement proxy without real analytics DB."""

from __future__ import annotations


def estimate_view_count(
    heat: float,
    rss_count: int,
    google_rank: int | None,
    x_rank: int | None,
    x_volume: int = 0,
) -> int:
    base = int(heat * 750_000)
    base += rss_count * 18_000
    if google_rank is not None:
        base += max(1, 26 - google_rank) * 25_000
    if x_rank is not None:
        base += max(1, 26 - x_rank) * 22_000
    if x_volume > 0:
        base += x_volume
    return max(base, 5_000)
