"""Per-state heat cells for India map UI (derived from headlines + momentum)."""

from __future__ import annotations

import hashlib
from typing import Literal

from app.utils.states_hi import STATE_HINDI, detect_state_codes, hindi_state_name

MomentumSignal = Literal["rising", "stable", "falling"]


def derive_momentum(google_rank: int | None, x_rank: int | None) -> MomentumSignal:
    rank = google_rank if google_rank is not None else x_rank
    if rank is not None and rank <= 5:
        return "rising"
    if rank is not None and rank >= 15:
        return "falling"
    return "stable"


def _seeded_noise(topic: str, code: str) -> float:
    digest = hashlib.md5(f"{topic}:{code}".encode()).hexdigest()
    return int(digest[:6], 16) / 0xFFFFFF


def build_state_heatmap(
    topic: str,
    headlines: list[str],
    heat: float,
    google_rank: int | None,
    x_rank: int | None,
) -> list[dict[str, str | float]]:
    """
    One cell per state/UT. Mentioned states get higher intensity and global momentum;
    others get a softer stable baseline tinted by topic hash.
    """
    momentum = derive_momentum(google_rank, x_rank)
    blob = " ".join([topic, *headlines[:8]])
    mentioned = detect_state_codes(blob)
    heat_norm = max(0.0, min(1.0, heat))

    cells: list[dict[str, str | float]] = []
    for code in STATE_HINDI:
        if code in mentioned:
            intensity = 0.5 + heat_norm * 0.5
            signal: MomentumSignal = momentum
        else:
            noise = _seeded_noise(topic, code)
            intensity = 0.1 + noise * 0.35 * (0.4 + heat_norm * 0.6)
            signal = momentum if momentum == "falling" and noise > 0.7 else "stable"

        cells.append(
            {
                "code": code,
                "name_hi": hindi_state_name(code),
                "intensity": round(min(1.0, intensity), 3),
                "signal": signal,
            }
        )

    cells.sort(key=lambda c: float(c["intensity"]), reverse=True)
    return cells
