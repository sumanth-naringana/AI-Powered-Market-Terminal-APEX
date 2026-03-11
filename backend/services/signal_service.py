import ollama
import json
import re


def ai_trading_signal(data):

    prompt = f"""
    You are a professional stock trading analyst.

    Analyze the following stock data and decide the trading signal.

    Data:
    {data}

    Respond ONLY with JSON:

    {{
    "signal": "BUY | SELL | HOLD",
    "confidence": "0-100",
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
        # Extract JSON block
        match = re.search(r"\{.*\}", content, re.S)

        if match:
            return json.loads(match.group())

        return {
            "signal": "UNKNOWN",
            "confidence": "0",
            "reason": content
        }