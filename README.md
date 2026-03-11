# AI Powered Market Terminal APEX

<p align="center">
An AI-driven stock market intelligence dashboard that analyzes market indicators and financial news to generate intelligent trading signals.
</p>

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![AI](https://img.shields.io/badge/AI-LLM%20Analysis-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

</p>

---

# Overview

AI Powered Market Terminal APEX is a **modern AI trading dashboard** that combines:

• Technical market indicators
• Real-time financial news
• Large Language Models (LLMs)

The system analyzes these signals together to produce **AI-generated trading insights** such as:

BUY • SELL • HOLD

---

## 🎥  Application Preview

![AI Powered Market Terminal APEX Demo](demo/apex_demo_video.gif)


---

# Core Features

## AI Trading Signals

The system evaluates market data and news sentiment using AI to generate trading signals.

Example output:

```
Signal: BUY
Confidence: 80%

Reason:
RSI indicates oversold conditions while positive news sentiment supports bullish momentum.
```

---

## Real-Time Market Charts

Interactive candlestick charts built with **Lightweight Charts**.

Indicators supported:

* RSI (Relative Strength Index)
* Moving Average 50
* Moving Average 200

Charts update automatically to reflect market movement.

---

## AI News Sentiment Analysis

The system pulls financial news and analyzes it using AI.

Each article is evaluated for:

* Sentiment (Positive / Negative / Neutral)
* Impact strength
* Explanation

Example:

```
News: Company signs major AI contract

Sentiment: Positive
Impact: High
Reason: Expected revenue growth from new contract
```

---

## Watchlist Tracking

Users can track multiple stocks simultaneously.

Features:

* Persistent watchlist
* Quick symbol switching
* Integrated AI analysis

---

# Architecture

```
Frontend Dashboard
│
├── Watchlist Manager
├── Interactive Charts
├── News Intelligence Panel
└── AI Signal Generator
        │
        ▼
Backend API (FastAPI)
│
├── Market Data Service
│     └── yfinance
│
├── News Intelligence Service
│     └── Google News RSS
│
└── AI Analysis Engine
      └── LLM-powered trading analysis
```

---

# Tech Stack

| Layer       | Technology         |
| ----------- | ------------------ |
| Backend     | FastAPI            |
| Data Source | yfinance           |
| News Feed   | Google News RSS    |
| AI Engine   | Ollama / LLM       |
| Frontend    | JavaScript         |
| Charts      | Lightweight Charts |

---

# Project Structure

```
AI-Powered-Market-Terminal-APEX

backend
│
├── main.py
│
├── services
│   ├── stock_service.py
│   ├── news_service.py
│   ├── ai_service.py
│   └── signal_service.py

frontend
│
├── index.html
└── app.js
```

---

# Running the Project

## Install dependencies

Using uv:

```
uv sync
```

Or using pip:

```
pip install -r requirements.txt
```

---

## Start Backend

```
uv run uvicorn backend.main:app --reload
```

Backend API will run at:

```
http://127.0.0.1:8000
```

---

## Open Dashboard

Open the frontend file:

```
frontend/index.html
```

---

# API Endpoints

## Stock Market Data

```
GET /stock/{symbol}
```

Returns:

* candlestick data
* RSI
* moving averages

---

## News Intelligence

```
GET /news/{symbol}
```

Returns:

* news headlines
* sentiment analysis
* impact evaluation

---

## AI Trading Signal

```
GET /signal/{symbol}
```

Returns:

* trading signal
* confidence score
* reasoning

---

# Future Enhancements

Planned improvements:

• Chart pattern detection (Breakouts, Head & Shoulders)
• Portfolio tracking
• AI backtesting engine
• Real-time price streaming
• Cloud deployment

---

# Disclaimer

This project is intended for **research and educational purposes only**.

It does **not constitute financial advice**.

Always conduct your own market research before making trading decisions.

---

# Author

Sumanth Suvarna

AI Engineering • Market Intelligence • Data Systems
