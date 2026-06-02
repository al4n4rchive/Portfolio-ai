# AIvestor 📈

An AI-powered stock portfolio analyzer, real-time stock lookup, watchlist manager, and market prediction tool built with React, Python Flask, yFinance, and Groq AI.

🔗 **Live Demo:** https://portfolio-ai-gamma-indol.vercel.app/

---

## Features

### 📊 Portfolio AI Analyzer
- Enter your stock holdings (ticker, shares, buy price, buy date)
- Fetches real-time prices using yFinance
- Sends portfolio data to Groq AI (LLaMA 3.3 70B)
- Returns beginner-friendly buy, hold, or sell recommendations
- **Performance Metrics** — total value, gain/loss, return %, and S&P 500 comparison
- **Risk & Diversification Analysis** — sector exposure pie chart and diversification score
- **AI Optimization** — rebalancing suggestions based on your holdings
- **Portfolio Breakdown Chart** — visual allocation of each stock in your portfolio
- **Follow-up chat** — ask the AI questions about your portfolio after the analysis
- **Portfolio History** — view and continue past analyses

### 🔍 Stock Lookup
- Search any stock ticker
- View price history as an interactive line graph
- Select time periods: 1W, 1M, 6M, 1Y, 5Y
- Shows current price, period high, and period low
- **📰 Latest News** — recent headlines for the searched stock (powered by Finnhub)
- **AI Prediction** — get a short-term market outlook powered by Groq AI
- **Follow-up chat** — ask questions about the stock after the prediction

### ⭐ Watchlist
- Save favorite stocks from the Stock Lookup page
- Click a saved ticker to instantly load its data
- Remove stocks from the watchlist at any time
- Persists across sessions via localStorage

### 🌐 Bilingual Support
- Full English and Spanish support
- Switch languages instantly with the toggle button
- AI responses are generated in the selected language

### 🌙 Dark Mode
- Toggle between light and dark themes

### ℹ️ About Page
- App info, disclaimer, tech stack, and author links

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, Vite, Chart.js               |
| Backend    | Python, Flask                       |
| Data & AI  | yFinance, Groq API (LLaMA 3.3 70B)  |
| News       | Finnhub API                         |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
Portfolio-ai/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   └── .env                # API keys (not committed)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── About.jsx
    │   │   ├── Portfolio.jsx
    │   │   └── StockLookup.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Groq API key → [console.groq.com](https://console.groq.com)
- Finnhub API key (free) → [finnhub.io](https://finnhub.io) (for news)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:
```
GROQ_API_KEY=your_groq_api_key_here
FINNHUB_KEY=your_finnhub_api_key_here
```

Start Flask:
```bash
python app.py
```

Flask runs on `http://127.0.0.1:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

React runs on `http://localhost:5173`

---

## API Endpoints

### `POST /analyze`
Analyzes a stock portfolio and returns AI feedback with performance metrics.

**Request body:**
```json
{
  "holdings": [
    { "ticker": "AAPL", "shares": 10, "buyPrice": 150.00, "buyDate": "2024-01-01" }
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "analysis": "AI generated feedback...",
  "totalValue": 3120.60,
  "totalCost": 1500.00,
  "gainLoss": 1620.60,
  "portfolioReturn": 108.04,
  "sp500Return": 24.5,
  "beatMarket": true,
  "sectors": { "Technology": 100.0 },
  "diversificationScore": 10
}
```

---

### `GET /stock_lookup?ticker=AAPL&period=1mo`
Returns stock information and historical pricing data.

**Valid periods:** `1wk`, `1mo`, `6mo`, `1y`, `5y`

**Response:**
```json
{
  "name": "Apple Inc.",
  "ticker": "AAPL",
  "price": 312.06,
  "high": 315.00,
  "low": 267.89,
  "period": "1mo",
  "prices": [{ "date": "May 01, 2026", "price": 279.88 }]
}
```

---

### `POST /predict`
Returns an AI-generated short-term market prediction.

**Request body:**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "prices": [{ "date": "May 01, 2026", "price": 279.88 }],
  "high": 315.00,
  "low": 267.89,
  "period": "1mo",
  "language": "en"
}
```

**Response:**
```json
{
  "prediction": "AI generated market outlook..."
}
```

---

### `POST /chat`
Handles follow-up questions about a portfolio analysis or stock prediction.

**Request body:**
```json
{
  "messages": [
    { "role": "assistant", "content": "Prior AI analysis..." },
    { "role": "user", "content": "Should I buy more?" }
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "reply": "AI response..."
}
```

---

### `GET /news?ticker=AAPL`
Returns the latest news headlines for a stock.

**Response:**
```json
{
  "articles": [
    {
      "headline": "Apple hits all-time high...",
      "source": "Reuters",
      "url": "https://...",
      "date": "Jun 01, 2026"
    }
  ]
}
```

---

## Deployment

### Backend → Render
1. Push `backend` folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root directory to `backend`
4. Set start command: `gunicorn app:app`
5. Add environment variables: `GROQ_API_KEY` and `FINNHUB_KEY`
6. Deploy and copy the live URL

### Frontend → Vercel
1. Update fetch URLs in components to your Render URL
2. Push `frontend` folder to GitHub
3. Go to [vercel.com](https://vercel.com) → New Project
4. Set root directory to `frontend`, connect repo and deploy

> ⚠️ Render's free tier spins down after inactivity. The first request may take 30–60 seconds to wake the server.

---

## Author

**Alan Martinez**
- GitHub: [@al4n4rchive](https://github.com/al4n4rchive)
- LinkedIn: [alanmartinez08](https://www.linkedin.com/in/alanmartinez08)
- ☕ [Buy me a coffee](https://buymeacoffee.com/alanmartinez)

---

## Disclaimer

AIvestor is intended for educational and informational purposes only. AI-generated analyses and predictions are not financial advice. Always do your own research and consult a qualified financial professional before making investment decisions.
