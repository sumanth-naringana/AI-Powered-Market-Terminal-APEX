import feedparser
import urllib.parse
from datetime import datetime
from backend.services.ai_service import analyze_news

def fetch_news(symbol):

    query = f"{symbol} stock"

    encoded_query = urllib.parse.quote(query)

    url = f"https://news.google.com/rss/search?q={encoded_query}"

    feed = feedparser.parse(url)

    news = []

    for entry in feed.entries[:5]:

        published = None

        if hasattr(entry, "published_parsed") and entry.published_parsed:
            published = datetime(*entry.published_parsed[:6]).isoformat()

        analysis = analyze_news(entry.title)

        news.append({
            "title": entry.title,
            "link": entry.link,
            "published": published,
            "sentiment": analysis["sentiment"],
            "impact": analysis["impact_strength"],
            "reason": analysis["reason"]
        })


    return news