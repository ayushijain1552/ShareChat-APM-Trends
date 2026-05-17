"""Drop news older than the configured window from the pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

MAX_NEWS_AGE_DAYS = 7


def cutoff_datetime(now: datetime | None = None) -> datetime:
    ref = now or datetime.now(timezone.utc)
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=timezone.utc)
    return ref - timedelta(days=MAX_NEWS_AGE_DAYS)


def is_fresh(published: datetime | None, now: datetime | None = None) -> bool:
    if published is None:
        return False
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    return published >= cutoff_datetime(now)


def parse_article_published(article: dict) -> datetime | None:
    raw = article.get("published")
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw
    try:
        text = str(raw).replace("Z", "+00:00")
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except (TypeError, ValueError):
        return None


def filter_fresh_articles(
    articles: list[dict],
    now: datetime | None = None,
) -> list[dict]:
    fresh: list[dict] = []
    for article in articles:
        published = parse_article_published(article)
        if is_fresh(published, now):
            fresh.append(article)
    return fresh


def filter_fresh_headlines_from_articles(articles: list[dict]) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for article in articles:
        title = (article.get("title") or "").strip()
        if title and title.lower() not in seen:
            seen.add(title.lower())
            titles.append(title)
    return titles
