import ollama
import json


def analyze_news(title):

    prompt = f"""
    You are a financial news analyst.

    Analyze the stock market impact of this news headline.

    Headline: {title}

    Respond ONLY in JSON format:

    {{
      "sentiment": "Positive | Negative | Neutral",
      "impact_strength": "Low | Medium | High",
      "reason": "short explanation"
    }}
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response["message"]["content"]

    try:
        return json.loads(content)
    except:
        return {
            "sentiment": "Unknown",
            "impact_strength": "Unknown",
            "reason": content
        }