"""Trend scoring and heuristic boosts."""

from app.scoring.scorer import score_merged_topics
from app.scoring.boosts import apply_heuristic_boosts

__all__ = ["score_merged_topics", "apply_heuristic_boosts"]
