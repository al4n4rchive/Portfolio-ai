import os
import requests
import yfinance as yf

from groq import Groq
from datetime import datetime, timedelta

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
groq_key    = os.getenv("GROQ_API_KEY")
finnhub_key = os.getenv("FINNHUB_KEY")

# Groq client
groq_client = Groq(api_key=groq_key)

# Flask app
app = Flask(__name__)

CORS(app, origins=[
    "http://localhost:5173",
    "https://portfolio-ai-e1lf.onrender.com",
    "https://portfolio-ai-gamma-indol.vercel.app"
])


# Get current stock price using yfinance
def get_stock_price(ticker):
    try:
        stock   = yf.Ticker(ticker)
        history = stock.history(period="1d")
        if history.empty:
            return None
        return round(float(history["Close"].iloc[-1]), 2)
    except Exception as e:
        print("yFinance Error:", e)
        return None


# Get SPY return from a start date to today
def get_spy_return(start_date_str):
    try:
        start = datetime.strptime(start_date_str, "%Y-%m-%d")
        spy   = yf.Ticker("SPY")
        hist  = spy.history(start=start_date_str, end=datetime.today().strftime("%Y-%m-%d"))

        if hist.empty:
            return None

        spy_start = float(hist["Close"].iloc[0])
        spy_end   = float(hist["Close"].iloc[-1])
        return round(((spy_end - spy_start) / spy_start) * 100, 2)

    except Exception as e:
        print("SPY Error:", e)
        return None


# Common ticker → sector fallback map
SECTOR_MAP = {
    # Technology
    "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology",
    "GOOG": "Technology", "META": "Technology", "NVDA": "Technology",
    "AMD": "Technology", "INTC": "Technology", "CRM": "Technology",
    "ORCL": "Technology", "ADBE": "Technology", "CSCO": "Technology",
    "QCOM": "Technology", "TXN": "Technology", "AVGO": "Technology",
    "TSM": "Technology", "ASML": "Technology", "NOW": "Technology",
    "SNOW": "Technology", "PLTR": "Technology", "NET": "Technology",
    # Consumer
    "AMZN": "Consumer", "TSLA": "Consumer", "NKE": "Consumer",
    "SBUX": "Consumer", "MCD": "Consumer", "HD": "Consumer",
    "LOW": "Consumer", "TGT": "Consumer", "WMT": "Consumer",
    "COST": "Consumer", "DIS": "Consumer", "NFLX": "Consumer",
    # Finance
    "JPM": "Finance", "BAC": "Finance", "GS": "Finance",
    "MS": "Finance", "WFC": "Finance", "C": "Finance",
    "V": "Finance", "MA": "Finance", "AXP": "Finance",
    "BLK": "Finance", "SCHW": "Finance", "COF": "Finance",
    # Healthcare
    "JNJ": "Healthcare", "PFE": "Healthcare", "MRK": "Healthcare",
    "ABBV": "Healthcare", "UNH": "Healthcare", "TMO": "Healthcare",
    "ABT": "Healthcare", "LLY": "Healthcare", "BMY": "Healthcare",
    "AMGN": "Healthcare", "GILD": "Healthcare", "CVS": "Healthcare",
    # Energy
    "XOM": "Energy", "CVX": "Energy", "COP": "Energy",
    "SLB": "Energy", "EOG": "Energy", "MPC": "Energy",
    "OXY": "Energy", "PSX": "Energy", "VLO": "Energy",
    # Industrials
    "BA": "Industrials", "CAT": "Industrials", "GE": "Industrials",
    "HON": "Industrials", "MMM": "Industrials", "UPS": "Industrials",
    "FDX": "Industrials", "RTX": "Industrials", "LMT": "Industrials",
    # ETFs
    "SPY": "ETF", "QQQ": "ETF", "VOO": "ETF", "VTI": "ETF",
    "IWM": "ETF", "DIA": "ETF", "GLD": "ETF", "TLT": "ETF",
}

# Get sector info for a ticker
def get_sector(ticker):
    # Check hardcoded map first
    if ticker.upper() in SECTOR_MAP:
        return SECTOR_MAP[ticker.upper()]
    # Fall back to yFinance
    try:
        info   = yf.Ticker(ticker).info
        sector = info.get("sector") or info.get("industryDisp") or ""
        return sector if sector else "Other"
    except:
        return "Other"


# Calculate diversification score 0-100
def calc_diversification_score(sector_weights):
    if not sector_weights:
        return 0
    n = len(sector_weights)
    if n == 1:
        return 10
    max_weight = max(sector_weights.values())
    # higher concentration = lower score
    concentration_penalty = max_weight / 100
    base_score = min(n * 15, 70)
    score = base_score + (1 - concentration_penalty) * 30
    return round(min(score, 100))


# Analyze portfolio route
@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    if not data or "holdings" not in data:
        return jsonify({"error": "Missing holdings data"}), 400

    holdings = data["holdings"]
    language = data.get("language", "en")

    portfolio_summary  = []
    total_value        = 0
    total_cost         = 0
    sector_values      = {}
    oldest_date        = None

    for holding in holdings:
        ticker    = holding.get("ticker")
        shares    = holding.get("shares")
        buy_price = holding.get("buyPrice")
        buy_date  = holding.get("buyDate", "")

        if not ticker or not shares or not buy_price:
            continue

        try:
            shares    = float(shares)
            buy_price = float(buy_price)
        except ValueError:
            continue

        # Track oldest buy date for S&P 500 comparison
        if buy_date:
            try:
                d = datetime.strptime(buy_date, "%Y-%m-%d")
                if oldest_date is None or d < oldest_date:
                    oldest_date = d
            except:
                pass

        current_price = get_stock_price(ticker)
        if current_price is None:
            continue

        current_value  = current_price * shares
        cost_basis     = buy_price * shares
        gain_loss      = current_value - cost_basis
        percent_change = ((current_price - buy_price) / buy_price) * 100

        total_value += current_value
        total_cost  += cost_basis

        # Get sector for diversification
        sector = get_sector(ticker)
        sector_values[sector] = sector_values.get(sector, 0) + current_value

        line = (
            f"{ticker}: {shares} shares | "
            f"bought at ${buy_price:.2f} | "
            f"now ${current_price:.2f} | "
            f"gain/loss: ${gain_loss:+.2f} ({percent_change:+.2f}%)"
        )
        portfolio_summary.append(line)

    if len(portfolio_summary) == 0:
        error_msg = (
            "No valid holdings found. Check your tickers and try again."
            if language == "en"
            else "No se encontraron inversiones válidas."
        )
        return jsonify({"error": error_msg}), 400

    # Portfolio metrics
    total_gain_loss     = round(total_value - total_cost, 2)
    portfolio_return    = round(((total_value - total_cost) / total_cost) * 100, 2) if total_cost > 0 else 0

    # Sector weights as percentages
    sector_weights = {
        s: round((v / total_value) * 100, 1)
        for s, v in sector_values.items()
    } if total_value > 0 else {}

    diversification_score = calc_diversification_score(sector_weights)

    # S&P 500 comparison
    sp500_return = None
    if oldest_date:
        sp500_return = get_spy_return(oldest_date.strftime("%Y-%m-%d"))
    else:
        # Default to 1 year ago
        one_year_ago = (datetime.today() - timedelta(days=365)).strftime("%Y-%m-%d")
        sp500_return = get_spy_return(one_year_ago)

    # Beat the market?
    beat_market = None
    if sp500_return is not None:
        beat_market = portfolio_return > sp500_return

    # Build sector string for prompt
    sector_str = "\n".join([f"  {s}: {w}%" for s, w in sector_weights.items()])

    # Build prompt
    summary_text = "\n".join(portfolio_summary)

    sp500_line = (
        f"S&P 500 return (same period): {sp500_return:+.2f}%"
        if sp500_return is not None
        else "S&P 500 comparison: unavailable"
    )

    if language == "es":
        prompt = f"""
Eres un asesor financiero experto. Responde SOLO en español.

Un usuario ha compartido su portafolio de inversiones con las siguientes métricas:

MÉTRICAS DEL PORTAFOLIO:
- Valor total: ${total_value:,.2f}
- Costo total: ${total_cost:,.2f}
- Ganancia/Pérdida total: ${total_gain_loss:+,.2f}
- Retorno del portafolio: {portfolio_return:+.2f}%
- {sp500_line}
- Puntuación de diversificación: {diversification_score}/100

EXPOSICIÓN POR SECTOR:
{sector_str}

INVERSIONES INDIVIDUALES:
{summary_text}

Por favor proporciona:
1. Resumen del rendimiento general del portafolio
2. Comparación vs S&P 500 (¿superó al mercado?)
3. Análisis de riesgo (concentración sectorial, posición más grande)
4. Inversiones en riesgo o perdiendo valor
5. Inversiones funcionando bien
6. Recomendaciones de optimización específicas (comprar, mantener, vender)
7. Sugerencias para mejorar la diversificación

Mantén la respuesta amigable para principiantes y clara.
"""
    else:
        prompt = f"""
You are an expert financial advisor. Respond ONLY in English.

A user has shared their investment portfolio with the following metrics:

PORTFOLIO METRICS:
- Total portfolio value: ${total_value:,.2f}
- Total cost basis: ${total_cost:,.2f}
- Total gain/loss: ${total_gain_loss:+,.2f}
- Portfolio return: {portfolio_return:+.2f}%
- {sp500_line}
- Diversification score: {diversification_score}/100

SECTOR EXPOSURE:
{sector_str}

INDIVIDUAL HOLDINGS:
{summary_text}

Please provide:
1. Overall portfolio performance summary
2. S&P 500 comparison (did they beat the market?)
3. Risk analysis (sector concentration, largest position)
4. Holdings at risk or losing value
5. Holdings performing well
6. Specific optimization recommendations (buy, hold, sell)
7. Suggestions to improve diversification

Keep the response beginner friendly and clear.
"""

    try:
        chat = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        analysis = chat.choices[0].message.content

        return jsonify({
            "analysis":             analysis,
            "totalValue":           round(total_value, 2),
            "totalCost":            round(total_cost, 2),
            "gainLoss":             total_gain_loss,
            "portfolioReturn":      portfolio_return,
            "sp500Return":          sp500_return,
            "beatMarket":           beat_market,
            "sectors":              sector_weights,
            "diversificationScore": diversification_score
        })

    except Exception as e:
        print("Server Error:", e)
        return jsonify({
            "error": "Unexpected server error",
            "details": str(e)
        }), 500


# Chat route
@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data or "messages" not in data:
        return jsonify({"error": "Missing messages"}), 400

    language = data.get("language", "en")
    messages = data["messages"]

    system_prompt = (
        "You are a helpful financial assistant. You answer questions about stocks, investing, "
        "personal finance, and market trends in a beginner-friendly way. Keep answers concise and clear. "
        "Respond ONLY in English."
        if language == "en"
        else
        "Eres un asistente financiero útil. Respondes preguntas sobre acciones, inversiones, "
        "finanzas personales y tendencias del mercado de forma amigable para principiantes. "
        "Mantén las respuestas concisas y claras. Responde SOLO en español."
    )

    try:
        chat_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in messages]
            ]
        )
        reply = chat_response.choices[0].message.content
        return jsonify({"reply": reply})

    except Exception as e:
        print("Chat Error:", e)
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500


# Predict route
@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    if not data or "ticker" not in data or "prices" not in data:
        return jsonify({"error": "Missing ticker or prices"}), 400

    ticker   = data.get("ticker")
    name     = data.get("name", ticker)
    prices   = data.get("prices", [])
    high     = data.get("high")
    low      = data.get("low")
    period   = data.get("period", "1mo")
    language = data.get("language", "en")

    if len(prices) < 2:
        return jsonify({"error": "Not enough price data"}), 400

    first_price    = prices[0]["price"]
    last_price     = prices[-1]["price"]
    first_date     = prices[0]["date"]
    last_date      = prices[-1]["date"]
    price_change   = round(last_price - first_price, 2)
    percent_change = round(((last_price - first_price) / first_price) * 100, 2)

    recent     = prices[-5:]
    recent_str = "\n".join([f"  {p['date']}: ${p['price']}" for p in recent])

    if language == "es":
        prompt = f"""
Eres un analista financiero experto. Responde SOLO en español.

Analiza los datos históricos de {name} ({ticker}) y proporciona una predicción.

Período ({period}):
- Precio inicial ({first_date}): ${first_price}
- Precio actual ({last_date}): ${last_price}
- Cambio: ${price_change:+} ({percent_change:+}%)
- Máximo: ${high} | Mínimo: ${low}

Precios recientes:
{recent_str}

Proporciona: tendencia actual, niveles clave, perspectiva 2-4 semanas, nivel de riesgo, recomendación para principiantes.
"""
    else:
        prompt = f"""
You are an expert financial analyst. Respond ONLY in English.

Analyze the historical price data for {name} ({ticker}) and provide a short-term prediction.

Period ({period}):
- Starting price ({first_date}): ${first_price}
- Current price ({last_date}): ${last_price}
- Change: ${price_change:+} ({percent_change:+}%)
- High: ${high} | Low: ${low}

Recent prices:
{recent_str}

Provide: current trend, key levels to watch, 2-4 week outlook, risk level, beginner recommendation.
"""

    try:
        chat_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        prediction = chat_response.choices[0].message.content
        return jsonify({"prediction": prediction})

    except Exception as e:
        print("Predict Error:", e)
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500


# News route
@app.route("/news", methods=["GET"])
def news():

    ticker = request.args.get("ticker", "").strip().upper()

    if not ticker:
        return jsonify({"error": "No ticker provided"}), 400

    if not finnhub_key:
        return jsonify({"error": "Finnhub API key not configured"}), 500

    try:
        today    = datetime.today().strftime("%Y-%m-%d")
        week_ago = (datetime.today() - timedelta(days=7)).strftime("%Y-%m-%d")

        url      = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from={week_ago}&to={today}&token={finnhub_key}"
        response = requests.get(url, timeout=10)
        data     = response.json()

        articles = []
        for item in data[:5]:
            articles.append({
                "headline": item.get("headline", ""),
                "source":   item.get("source", ""),
                "url":      item.get("url", ""),
                "date":     datetime.fromtimestamp(item.get("datetime", 0)).strftime("%b %d, %Y")
            })

        return jsonify({"articles": articles})

    except Exception as e:
        print("News Error:", e)
        return jsonify({"error": "Failed to fetch news", "details": str(e)}), 500

# Stock lookup route
@app.route("/stock_lookup", methods=["GET"])
def stock_lookup():

    ticker = request.args.get("ticker", "").strip().upper()
    period = request.args.get("period", "1mo")

    valid_periods = ["1wk", "1mo", "6mo", "1y", "5y"]
    if period not in valid_periods:
        period = "1mo"

    if not ticker:
        return jsonify({"error": "No ticker provided"}), 400

    try:
        stock   = yf.Ticker(ticker)
        history = stock.history(period=period)

        if history.empty:
            return jsonify({"error": f"Ticker '{ticker}' not found."}), 404

        try:
            info = stock.info
            name = info.get("longName") or info.get("shortName") or ticker
        except:
            name = ticker

        price = round(float(history["Close"].iloc[-1]), 2)
        high  = round(float(history["High"].max()), 2)
        low   = round(float(history["Low"].min()), 2)

        prices = []
        for date, row in history.iterrows():
            prices.append({
                "date":  date.strftime("%b %d, %Y"),
                "price": round(float(row["Close"]), 2)
            })

        return jsonify({
            "name": name, "ticker": ticker,
            "price": price, "high": high, "low": low,
            "period": period, "prices": prices
        })

    except Exception as e:
        print("Stock Lookup Error:", e)
        return jsonify({"error": "Failed to fetch stock data", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)