"""Outbound URLs for news articles and Google Trends explore pages."""

from __future__ import annotations

from urllib.parse import quote_plus

from app.utils.topic_match import filter_articles_for_topic


def build_google_trends_url(topic: str) -> str:
    q = quote_plus(topic.strip())
    return f"https://trends.google.com/trends/explore?geo=IN&q={q}"


def build_google_news_url(topic: str) -> str:
    q = quote_plus(topic.strip())
    return f"https://news.google.com/search?q={q}&hl=hi&gl=IN&ceid=IN:hi"


def pick_news_article_url(topic: str, articles: list[dict[str, str]]) -> str:
    """
    Prefer a real RSS article link; fall back to Google News search for the topic.
    articles items: {"title": str, "url": str}
    """
    relevant = filter_articles_for_topic(topic, articles)
    for item in relevant:
        url = (item.get("url") or "").strip()
        if url.startswith("http"):
            return url
    return build_google_news_url(topic)
