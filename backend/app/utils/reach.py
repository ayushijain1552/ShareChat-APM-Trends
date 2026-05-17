"""Estimated share of Indian population reached by a trend."""

from __future__ import annotations

# Approx. mid-2024 India population (UN/World Bank scale)
INDIA_POPULATION = 1_428_000_000


def estimate_india_reach_pct(
    view_count: int,
    heat: float,
    google_rank: int | None,
    x_rank: int | None,
    rss_count: int,
    x_mentions: int = 0,
) -> float:
    """
    Model reach as % of Indian population from engagement proxy + source breadth.
    Capped below 90% to stay plausible for a single trend topic.
    """
    # Modeled digital reach: heat + engagement proxy + multi-source breadth
    heat_pct = heat * 32.0
    view_pct = (view_count / INDIA_POPULATION) * 100.0 * 6.0
    breadth_pct = 0.0
    if google_rank is not None and google_rank <= 15:
        breadth_pct += 2.5
    if x_rank is not None and x_rank <= 15:
        breadth_pct += 1.8
    if rss_count >= 2:
        breadth_pct += min(3.0, rss_count * 0.4)
    if x_mentions >= 2:
        breadth_pct += 1.2

    pct = heat_pct + view_pct + breadth_pct
    pct = max(0.5, min(89.5, pct))
    return round(pct, 1)
