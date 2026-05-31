import os
import yfinance as yf

from groq import Groq

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS


# Load environment variables
load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        ".env"
    )
)

# API Keys
groq_key = os.getenv("GROQ_API_KEY")

# Groq client
groq_client = Groq(api_key=groq_key)

# Flask app
app = Flask(__name__)

# Allow requests from React dev server
CORS(
    app,
    origins=[
        "http://localhost:5173",  # Local development server
        "https://portfolio-ai-4w9i.onrender.com",  # Deployed backend/frontend URL
    ],
)


# Get current stock price using yfinance
def get_stock_price(ticker):
    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period="1d")

        if history.empty:
            print(f"Ticker {ticker} not found or no data returned.")
            return None

        return round(float(history["Close"].iloc[-1]), 2)

    except Exception as e:
        print("yFinance Error:", e)
        return None


# Analyze portfolio route
@app.route("/analyze", methods=["POST"])
def analyze():

    # Get request data
    data = request.get_json()

    # Validate request body
    if not data or "holdings" not in data:
        return jsonify({
            "error": "Missing holdings data"
        }), 400

    holdings = data["holdings"]
    portfolio_summary = []

    # Process each holding
    for holding in holdings:

        ticker = holding.get("ticker")
        shares = holding.get("shares")
        buy_price = holding.get("buyPrice")

        # Skip empty fields
        if not ticker or not shares or not buy_price:
            continue

        # Validate numbers
        try:
            shares = float(shares)
            buy_price = float(buy_price)
        except ValueError:
            continue

        # Get stock price via yfinance 
        current_price = get_stock_price(ticker)

        if current_price is None:
            continue

        # Portfolio calculations
        current_value = current_price * shares
        gain_loss = current_value - (buy_price * shares)
        percent_change = (
            (current_price - buy_price)
            / buy_price
        ) * 100

        # Portfolio summary line
        line = (
            f"{ticker}: {shares} shares | "
            f"bought at ${buy_price:.2f} | "
            f"now ${current_price:.2f} | "
            f"gain/loss: ${gain_loss:+.2f} "
            f"({percent_change:+.2f}%)"
        )

        portfolio_summary.append(line)

    # Handle empty portfolio
    if len(portfolio_summary) == 0:
        return jsonify({
            "error": "No valid holdings found. Check your tickers and try again."
        }), 400

    # Build prompt
    summary_text = "\n".join(portfolio_summary)

    prompt = f"""
You are a helpful financial advisor.

A user has shared their investment portfolio below.

Please do the following:
1. Identify which holdings are at risk or losing value
2. Identify which holdings are performing well
3. Give clear buy, hold, or sell recommendations
4. Keep your response beginner friendly

Portfolio:
{summary_text}
"""

    # Groq API call
    try:
        chat = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        analysis = chat.choices[0].message.content

        return jsonify({
            "analysis": analysis
        })

    except Exception as e:
        print("Server Error:", e)
        return jsonify({
            "error": "Unexpected server error",
            "details": str(e)
        }), 500


# Stock lookup route
@app.route("/stock_lookup", methods=["GET"])
def stock_lookup():

    ticker = request.args.get("ticker", "").strip().upper()
    period = request.args.get("period", "1mo")

    # Validate period — only allow known yfinance values
    valid_periods = ["1wk", "1mo", "6mo", "1y", "5y"]
    if period not in valid_periods:
        period = "1mo"

    if not ticker:
        return jsonify({
            "error": "No ticker provided"
        }), 400

    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period=period)

        if history.empty:
            return jsonify({
                "error": f"Ticker '{ticker}' not found. Check the symbol and try again."
            }), 404

        # Safely get company name — .info can fail on some tickers
        try:
            info = stock.info
            name = info.get("longName") or info.get("shortName") or ticker
        except Exception:
            name = ticker

        # Current price and period stats
        price = round(float(history["Close"].iloc[-1]), 2)
        high  = round(float(history["High"].max()), 2)
        low   = round(float(history["Low"].min()), 2)

        # Build full price history list for the graph
        prices = []
        for date, row in history.iterrows():
            prices.append({
                "date":  date.strftime("%b %d, %Y"),
                "price": round(float(row["Close"]), 2)
            })

        return jsonify({
            "name":   name,
            "ticker": ticker,
            "price":  price,
            "high":   high,
            "low":    low,
            "period": period,
            "prices": prices
        })

    except Exception as e:
        print("Stock Lookup Error:", e)
        return jsonify({
            "error": "Failed to fetch stock data",
            "details": str(e)
        }), 500


# Run app
if __name__ == "__main__":
    app.run(debug=True)