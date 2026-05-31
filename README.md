# Portfolio AI 📈

An AI-powered stock portfolio analyzer and real-time stock lookup tool built with React, Python Flask, yFinance, and Groq AI.

🔗 **Live Demo:** https://portfolio-ai-gamma-indol.vercel.app

---

## Features

### Portfolio AI Analyzer
- Enter your stock holdings (ticker, shares, buy price)
- Fetches real-time prices using yFinance
- Sends portfolio data to Groq AI (LLaMA 3.3 70B)
- Returns beginner-friendly buy, hold, or sell recommendations

### Stock Lookup
- Search any stock ticker
- View price history as an interactive line graph
- Select time periods: 1W, 1M, 6M, 1Y, 5Y
- Shows current price, period high and period low

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Chart.js |
| Backend | Python, Flask |
| Data & AI | yFinance, Groq API (LLaMA 3.3 70B) |
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
```

Start Flask:
```bash
python app.py
```

Flask runs on http://127.0.0.1:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

React runs on http://localhost:5173

---

## API Endpoints

### `POST /analyze`

Analyzes a stock portfolio and returns AI feedback.

Request body:
```json
{
  "holdings": [
    { "ticker": "AAPL", "shares": 10, "buyPrice": 150.00 }
  ]
}
```

Response:
```json
{
  "analysis": "AI generated feedback..."
}
```

### `GET /stock_lookup?ticker=AAPL&period=1mo`

Returns price history for a stock over a given period.

Valid periods: `1wk`, `1mo`, `6mo`, `1y`, `5y`

Response:
```json
{
  "name": "Apple Inc.",
  "ticker": "AAPL",
  "price": 312.06,
  "high": 315.00,
  "low": 267.89,
  "period": "1mo",
  "prices": [
    { "date": "May 01, 2026", "price": 279.88 }
  ]
}
```

---

## Deployment

### Backend → Render
1. Push `backend` folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set start command: `gunicorn app:app`
5. Add environment variable: `GROQ_API_KEY`
6. Deploy and copy the live URL

### Frontend → Vercel
1. Update fetch URLs in `Portfolio.jsx` and `StockLookup.jsx` to your Render URL
2. Push `frontend` folder to GitHub
3. Go to [vercel.com](https://vercel.com) → New Project
4. Connect your repo and deploy

> ⚠️ Render's free tier spins down after inactivity. The first request may take 30–60 seconds to wake the server.

---

## Author

**Alan Martinez**

- GitHub: [@al4n4rchive](https://github.com/al4n4rchive)
- LinkedIn: [alanmartinez08](https://www.linkedin.com/in/alanmartinez08/)
