from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.services.stock_service import fetch_stock_data
from backend.services.news_service import fetch_news
from backend.services.signal_service import ai_trading_signal

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Stock AI API running"}


@app.get("/stock/{symbol}")
def get_stock(symbol: str, interval: str = "1h"):

    candles, ma50, ma200, rsi = fetch_stock_data(symbol, interval)

    return {
        "candles": candles,
        "ma50": ma50,
        "ma200": ma200,
        "rsi": rsi
    }


@app.get("/news/{symbol}")
def get_news(symbol: str):

    news = fetch_news(symbol)

    return {"news": news}


@app.get("/signal/{symbol}")
def get_signal(symbol: str):

    candles, ma50, ma200, rsi = fetch_stock_data(symbol, "1h")

    latest_rsi = rsi[-1]["value"]

    latest_ma50 = ma50[-1]["value"]
    latest_ma200 = ma200[-1]["value"]

    price = candles[-1]["close"]

    news = fetch_news(symbol)

    sentiment = news[0]["sentiment"] if news else "Neutral"
    impact = news[0]["impact"] if news else "Low"

    data = {
        "price": price,
        "rsi": latest_rsi,
        "ma50": latest_ma50,
        "ma200": latest_ma200,
        "news_sentiment": sentiment,
        "news_impact": impact
    }

    signal = ai_trading_signal(data)

    return signal


# uv run uvicorn backend.main:app --reload