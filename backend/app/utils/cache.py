"""In-memory TTL cache — no Redis so deploy stays zero-ops for APM demos."""

from __future__ import annotations

import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")

# Tradeoff: process-local cache resets on restart and does not share across workers.
# For a single-instance APM assignment this is ideal; production would use Redis.
_CACHE: dict[str, tuple[float, Any]] = {}
DEFAULT_TTL_SECONDS = 600  # 10 minutes per assignment spec


def get_cached(key: str) -> Any | None:
    entry = _CACHE.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        del _CACHE[key]
        return None
    return value


def set_cached(key: str, value: Any, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> None:
    _CACHE[key] = (time.time() + ttl_seconds, value)


def get_or_set(key: str, factory: Callable[[], T], ttl_seconds: int = DEFAULT_TTL_SECONDS) -> tuple[T, bool]:
    """Return (value, was_cached)."""
    cached = get_cached(key)
    if cached is not None:
        return cached, True
    value = factory()
    set_cached(key, value, ttl_seconds)
    return value, False
