# AIvestor 📈

An AI-powered stock portfolio analyzer, real-time stock lookup, watchlist manager, and market prediction tool built with React, Python Flask, yFinance, and Groq AI.

🔗 **Live Demo:** https://portfolio-ai-gamma-indol.vercel.app/

---

## Features

### 📊 Portfolio AI Analyzer

* Enter your stock holdings (ticker, shares, buy price)
* Fetches real-time prices using yFinance
* Sends portfolio data to Groq AI (LLaMA 3.3 70B)
* Returns beginner-friendly buy, hold, or sell recommendations
* Interactive portfolio allocation chart showing the percentage of each stock in your portfolio
* Visual breakdown of portfolio diversification
* **Follow-up chat** — ask the AI questions about your portfolio after the analysis
* **Chat history** — previous portfolio conversations remain visible during the session

### 🔍 Stock Lookup

* Search any stock ticker
* View price history as an interactive line graph
* Select time periods: 1W, 1M, 6M, 1Y, 5Y
* Shows current price, period high, and period low
* **AI Prediction** — get a short-term market outlook powered by Groq AI
* Save stocks directly to your favorites watchlist
* **Follow-up chat** — ask questions about the stock after the prediction
* **Chat history** — keeps track of previous stock analysis conversations

### ⭐ Watchlist & Favorites

* Save favorite stocks from the Stock Lookup page
* Quickly access frequently tracked stocks
* Monitor multiple companies in one place
* Remove stocks from the watchlist at any time

### 🌐 Bilingual Support

* Full English and Spanish support
* Switch languages instantly with the toggle button
* AI responses are generated in the selected language

### 🌙 Dark Mode

* Toggle between light and dark themes

### ℹ️ About Page

* App info, disclaimer, tech stack, and author links

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React, Vite, Chart.js               |
| Backend    | Python, Flask                       |
| Data & AI  | yFinance, Groq API (LLaMA 3.3 70B)  |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## Project Structure

```text
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
    │   │   ├── StockLookup.jsx
    │   │   └── Watchlist.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## Getting Started

### Prerequisites

* Python 3.9+
* Node.js 18+
* Groq API Key → https://console.groq.com

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start Flask:

```bash
python app.py
```

Flask runs on:

```text
http://127.0.0.1:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

React runs on:

```text
http://localhost:5173
```

---

## API Endpoints

### `POST /analyze`

Analyzes a stock portfolio and returns AI feedback.

**Request Body**

```json
{
  "holdings": [
    {
      "ticker": "AAPL",
      "shares": 10,
      "buyPrice": 150
    }
  ],
  "language": "en"
}
```

**Response**

```json
{
  "analysis": "AI generated feedback..."
}
```

---

### `GET /stock_lookup?ticker=AAPL&period=1mo`

Returns stock information and historical pricing data.

**Valid Periods**

```text
1wk, 1mo, 6mo, 1y, 5y
```

**Response**

```json
{
  "name": "Apple Inc.",
  "ticker": "AAPL",
  "price": 312.06,
  "high": 315.0,
  "low": 267.89,
  "period": "1mo",
  "prices": [
    {
      "date": "May 01, 2026",
      "price": 279.88
    }
  ]
}
```

---

### `POST /predict`

Returns an AI-generated short-term market prediction.

**Request Body**

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "prices": [
    {
      "date": "May 01, 2026",
      "price": 279.88
    }
  ],
  "high": 315.0,
  "low": 267.89,
  "period": "1mo",
  "language": "en"
}
```

**Response**

```json
{
  "prediction": "AI generated market outlook..."
}
```

---

### `POST /chat`

Handles follow-up questions related to portfolio analyses and stock predictions.

**Request Body**

```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Prior AI analysis..."
    },
    {
      "role": "user",
      "content": "Should I buy more?"
    }
  ],
  "language": "en"
}
```

**Response**

```json
{
  "reply": "AI response..."
}
```

---

## Recent Updates

### 📈 Portfolio Allocation Chart

A visual chart displays the percentage allocation of each stock in your portfolio, making it easier to understand diversification and concentration risk.

### ⭐ Watchlist System

Users can save favorite stocks directly from the Stock Lookup page and quickly revisit them later.

### 💬 Chat History

Portfolio and stock analysis chats now maintain conversation history during the session, allowing for more natural follow-up questions and AI interactions.

### 📊 Enhanced Analytics

Improved portfolio insights with visual representations and AI-generated recommendations.

---

## Deployment

### Backend → Render

1. Push the `backend` folder to GitHub
2. Go to https://render.com and create a new Web Service
3. Connect your repository
4. Set the root directory to `backend`
5. Set the start command:

```bash
gunicorn app:app
```

6. Add the environment variable:

```env
GROQ_API_KEY=your_groq_api_key_here
```

7. Deploy and copy the generated URL

### Frontend → Vercel

1. Update API URLs in your frontend components to point to your Render backend
2. Push the `frontend` folder to GitHub
3. Go to https://vercel.com and create a new project
4. Set the root directory to `frontend`
5. Connect your repository and deploy

> ⚠️ Render's free tier spins down after inactivity. The first request may take 30–60 seconds to wake the server.

---

## Author

**Alan Martinez**

* GitHub: [@al4n4rchive](https://github.com/al4n4rchive)
* LinkedIn: [alanmartinez08](https://www.linkedin.com/in/alanmartinez08)
* ☕ Buy Me a Coffee: https://buymeacoffee.com/alanmartinez

---

## Disclaimer

AIvestor is intended for educational and informational purposes only. The AI-generated analyses and predictions should not be considered financial advice. Always conduct your own research and consult a qualified financial professional before making investment decisions.
