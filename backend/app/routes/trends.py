"""GET /trends — top ranked trends with 10-minute cache."""

from __future__ import annotations

from fastapi import APIRouter

from app.utils.cache import get_or_set
from app.utils.models import TrendsResponse
from app.utils.pipeline import build_trends_response

router = APIRouter(tags=["trends"])

CACHE_KEY = "trends_top_10"


@router.get("/trends", response_model=TrendsResponse)
def get_trends() -> TrendsResponse:
    """
    Return top 10 ranked trends for Hindi-speaking Indian users.

    Tradeoff: synchronous collectors block the request thread (~2-8s cold).
    Acceptable for APM demo; production would use background refresh + stale-while-revalidate.
    """
    response, was_cached = get_or_set(CACHE_KEY, build_trends_response)
    # model_copy avoids mutating the cached object (cached flag would stick otherwise)
    return response.model_copy(update={"cached": was_cached})
