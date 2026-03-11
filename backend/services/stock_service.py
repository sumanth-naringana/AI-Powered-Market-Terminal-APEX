import yfinance as yf
import pandas as pd
import ta

def fetch_stock_data(symbol: str, interval: str):

    ticker = symbol + ".NS"

    data = yf.download(
        ticker,
        period="2y",
        interval=interval
    )

    close = data["Close"].squeeze()

    # Moving averages
    data["MA50"] = close.rolling(50).mean()
    data["MA200"] = close.rolling(200).mean()

    rsi_indicator = ta.momentum.RSIIndicator(close)
    data["RSI"] = rsi_indicator.rsi()

    candles = []
    ma50 = []
    ma200 = []
    rsi_data = []

    for index, row in data.iterrows():

        time_val = int(index.timestamp())

        open_price = row["Open"]
        high_price = row["High"]
        low_price = row["Low"]
        close_price = row["Close"]

        if hasattr(open_price, "iloc"):
            open_price = open_price.iloc[0]
            high_price = high_price.iloc[0]
            low_price = low_price.iloc[0]
            close_price = close_price.iloc[0]

        candles.append({
            "time": time_val,
            "open": float(open_price),
            "high": float(high_price),
            "low": float(low_price),
            "close": float(close_price)
        })

        ma50_value = row["MA50"]
        ma200_value = row["MA200"]

        # convert Series → scalar if needed
        if hasattr(ma50_value, "iloc"):
            ma50_value = ma50_value.iloc[0]

        if hasattr(ma200_value, "iloc"):
            ma200_value = ma200_value.iloc[0]

        ma50.append({
            "time": time_val,
            "value": float(ma50_value) if pd.notna(ma50_value) else None
        })

        ma200.append({
            "time": time_val,
            "value": float(ma200_value) if pd.notna(ma200_value) else None
        })

        rsi_value = row["RSI"]

        if hasattr(rsi_value, "iloc"):
            rsi_value = rsi_value.iloc[0]

        rsi_data.append({
            "time": time_val,
            "value": float(rsi_value) if pd.notna(rsi_value) else None
        })




    return candles, ma50, ma200, rsi_data