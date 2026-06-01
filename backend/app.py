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
groq_key    = os.getenv("GROQ_API_KEY")

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

    data = request.get_json()

    if not data or "holdings" not in data:
        return jsonify({"error": "Missing holdings data"}), 400

    holdings = data["holdings"]
    language = data.get("language", "en")

    portfolio_summary = []

    for holding in holdings:
        ticker    = holding.get("ticker")
        shares    = holding.get("shares")
        buy_price = holding.get("buyPrice")

        if not ticker or not shares or not buy_price:
            continue

        try:
            shares    = float(shares)
            buy_price = float(buy_price)
        except ValueError:
            continue

        current_price = get_stock_price(ticker)
        if current_price is None:
            continue

        current_value  = current_price * shares
        gain_loss      = current_value - (buy_price * shares)
        percent_change = ((current_price - buy_price) / buy_price) * 100

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
            else "No se encontraron inversiones válidas. Verifica los tickers e intenta de nuevo."
        )
        return jsonify({"error": error_msg}), 400

    summary_text = "\n".join(portfolio_summary)

    if language == "es":
        prompt = f"""
Eres un asesor financiero útil. Responde SOLO en español.

Un usuario ha compartido su portafolio de inversiones.

Por favor haz lo siguiente:
1. Identifica qué inversiones están en riesgo o perdiendo valor
2. Identifica qué inversiones están funcionando bien
3. Da recomendaciones claras de comprar, mantener o vender
4. Mantén tu respuesta amigable para principiantes

Portafolio:
{summary_text}
"""
    else:
        prompt = f"""
You are a helpful financial advisor. Respond ONLY in English.

A user has shared their investment portfolio below.

Please do the following:
1. Identify which holdings are at risk or losing value
2. Identify which holdings are performing well
3. Give clear buy, hold, or sell recommendations
4. Keep your response beginner friendly

Portfolio:
{summary_text}
"""

    try:
        chat = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        analysis = chat.choices[0].message.content
        return jsonify({"analysis": analysis})

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
        return jsonify({
            "error": "Unexpected server error",
            "details": str(e)
        }), 500


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
        return jsonify({"error": "Not enough price data to make a prediction"}), 400

    first_price    = prices[0]["price"]
    last_price     = prices[-1]["price"]
    first_date     = prices[0]["date"]
    last_date      = prices[-1]["date"]
    price_change   = round(last_price - first_price, 2)
    percent_change = round(((last_price - first_price) / first_price) * 100, 2)

    recent = prices[-5:]
    recent_str = "\n".join(
        [f"  {p['date']}: ${p['price']}" for p in recent]
    )

    if language == "es":
        prompt = f"""
Eres un analista financiero experto. Responde SOLO en español.

Analiza los siguientes datos históricos de precios para {name} ({ticker})
y proporciona una predicción del mercado a corto plazo.

Datos del período ({period}):
- Precio inicial ({first_date}): ${first_price}
- Precio actual ({last_date}): ${last_price}
- Cambio: ${price_change:+} ({percent_change:+}%)
- Máximo del período: ${high}
- Mínimo del período: ${low}

Precios recientes:
{recent_str}

Por favor proporciona:
1. Análisis de la tendencia actual (alcista, bajista o lateral)
2. Niveles clave a observar (soporte y resistencia)
3. Perspectiva a corto plazo (próximas 2-4 semanas)
4. Nivel de riesgo (bajo, medio, alto)
5. Recomendación breve para principiantes
"""
    else:
        prompt = f"""
You are an expert financial analyst. Respond ONLY in English.

Analyze the following historical price data for {name} ({ticker})
and provide a short-term market prediction.

Period data ({period}):
- Starting price ({first_date}): ${first_price}
- Current price ({last_date}): ${last_price}
- Change: ${price_change:+} ({percent_change:+}%)
- Period high: ${high}
- Period low: ${low}

Recent prices:
{recent_str}

Please provide:
1. Current trend analysis (bullish, bearish, or sideways)
2. Key levels to watch (support and resistance)
3. Short-term outlook (next 2-4 weeks)
4. Risk level (low, medium, high)
5. Brief recommendation for beginners
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
        return jsonify({
            "error": "Unexpected server error",
            "details": str(e)
        }), 500


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
            return jsonify({
                "error": f"Ticker '{ticker}' not found. Check the symbol and try again."
            }), 404

        try:
            info = stock.info
            name = info.get("longName") or info.get("shortName") or ticker
        except Exception:
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