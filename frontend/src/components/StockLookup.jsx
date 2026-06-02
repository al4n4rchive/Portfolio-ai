import { useState, useRef, useEffect } from "react";
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    PointElement, LineElement, Tooltip, Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const BASE_URL = "https://portfolio-ai-e1lf.onrender.com";

const PERIODS = [
    { label: "1W", value: "1wk" },
    { label: "1M", value: "1mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y"  },
    { label: "5Y", value: "5y"  }
];

const translations = {
    en: {
        title: "Stock Data",
        subtitle: "Search Stock Data:",
        placeholder: "Enter ticker (e.g. AAPL)",
        searchBtn: "Search",
        loading: "Loading...",
        high: "Period High",
        low: "Period Low",
        serverError: "Failed to connect to the server.",
        predictBtn: "Prediction 🔮",
        predicting: "Analyzing...",
        predictingNote: "This may take a moment while the AI analyzes the data.",
        predictionTitle: "AI Prediction",
        disclaimer: "⚠️ This is not financial advice. AI predictions are for educational purposes only.",
        chatTitle: "Ask about this stock",
        chatPlaceholder: "Ask anything about this stock...",
        sendBtn: "Send",
        thinking: "Thinking...",
        chatHint: "Press Enter to send • Shift+Enter for new line",
        shareBtn: "📤 Share Prediction",
        copied: "✅ Copied!",
        watchlistTitle: "⭐ Watchlist",
        addWatch: "Add to Watchlist",
        removeWatch: "Remove from Watchlist",
        noWatchlist: "No tickers saved yet.",
        newsTitle: "📰 Latest News",
        noNews: "No recent news found.",
    },
    es: {
        title: "Datos de Acciones",
        subtitle: "Buscar Datos de Acciones:",
        placeholder: "Ingresa un ticker (ej. AAPL)",
        searchBtn: "Buscar",
        loading: "Cargando...",
        high: "Máximo del Período",
        low: "Mínimo del Período",
        serverError: "No se pudo conectar al servidor.",
        predictBtn: "Predicción 🔮",
        predicting: "Analizando...",
        predictingNote: "Esto puede tardar un momento.",
        predictionTitle: "Predicción AI",
        disclaimer: "⚠️ Esto no es asesoramiento financiero. Solo con fines educativos.",
        chatTitle: "Pregunta sobre esta acción",
        chatPlaceholder: "Pregunta lo que quieras sobre esta acción...",
        sendBtn: "Enviar",
        thinking: "Pensando...",
        chatHint: "Presiona Enter para enviar • Shift+Enter para nueva línea",
        shareBtn: "📤 Compartir Predicción",
        copied: "✅ Copiado!",
        watchlistTitle: "⭐ Lista de Seguimiento",
        addWatch: "Agregar",
        removeWatch: "Eliminar",
        noWatchlist: "No hay tickers guardados.",
        newsTitle: "📰 Últimas Noticias",
        noNews: "No se encontraron noticias recientes.",
    }
};

function StockLookup({ lang }) {
    const [ticker, setTicker]             = useState("");
    const [period, setPeriod]             = useState("1mo");
    const [stockData, setStockData]       = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState("");
    const [prediction, setPrediction]     = useState("");
    const [predicting, setPredicting]     = useState(false);
    const [copied, setCopied]             = useState(false);
    const [watchlist, setWatchlist]       = useState([]);
    const [news, setNews]                 = useState([]);
    const [newsLoading, setNewsLoading]   = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]       = useState("");
    const [chatLoading, setChatLoading]   = useState(false);
    const bottomRef                       = useRef(null);

    const t = translations[lang] || translations.en;

    useEffect(() => {
        const saved = localStorage.getItem("watchlist");
        if (saved) setWatchlist(JSON.parse(saved));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    async function searchStock(overrideTicker) {
        const symbol = (overrideTicker || ticker).trim().toUpperCase();
        if (!symbol) return;

        setTicker(symbol);
        setLoading(true);
        setError("");
        setStockData(null);
        setPrediction("");
        setChatMessages([]);
        setNews([]);

        try {
            const res  = await fetch(`${BASE_URL}/stock_lookup?ticker=${symbol}&period=${period}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setStockData(data);
                fetchNews(symbol);
            }
        } catch {
            setError(t.serverError);
        }

        setLoading(false);
    }

    async function fetchNews(symbol) {
        setNewsLoading(true);
        try {
            const res  = await fetch(`${BASE_URL}/news?ticker=${symbol}`);
            const data = await res.json();
            if (!data.error && data.articles) {
                setNews(data.articles);
            } else {
                setNews([]);
            }
        } catch {
            setNews([]);
        }
        setNewsLoading(false);
    }

    async function getPrediction() {
        if (!stockData) return;

        setPredicting(true);
        setPrediction("");
        setChatMessages([]);

        try {
            const res  = await fetch(`${BASE_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker:   stockData.ticker,
                    name:     stockData.name,
                    prices:   stockData.prices,
                    high:     stockData.high,
                    low:      stockData.low,
                    period:   stockData.period,
                    language: lang
                })
            });
            const data = await res.json();

            if (data.error) {
                setPrediction("Error: " + data.error);
            } else {
                setPrediction(data.prediction);
                setChatMessages([{ role: "assistant", content: data.prediction }]);
            }
        } catch {
            setPrediction(t.serverError);
        }

        setPredicting(false);
    }

    async function sendChatMessage() {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        const userMessage     = { role: "user", content: text };
        const updatedMessages = [...chatMessages, userMessage];

        setChatMessages(updatedMessages);
        setChatInput("");
        setChatLoading(true);

        try {
            const res  = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: lang, messages: updatedMessages })
            });
            const data = await res.json();

            setChatMessages([...updatedMessages, {
                role: "assistant",
                content: data.error ? "Error: " + data.error : data.reply
            }]);
        } catch {
            setChatMessages([...updatedMessages, { role: "assistant", content: t.serverError }]);
        }

        setChatLoading(false);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") searchStock();
    }

    function handleChatKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    }

    function sharePrediction() {
        if (!stockData || !prediction) return;
        const text = `AIvestor Prediction 📈\n\n${stockData.name} (${stockData.ticker}) — ${stockData.period}\nCurrent Price: $${stockData.price}\nPeriod High: $${stockData.high} | Period Low: $${stockData.low}\n\nAI Outlook:\n${prediction}\n\nGenerated by AIvestor\nhttps://portfolio-ai-gamma-indol.vercel.app`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function addToWatchlist() {
        if (!stockData || watchlist.includes(stockData.ticker)) return;
        const updated = [...watchlist, stockData.ticker];
        setWatchlist(updated);
        localStorage.setItem("watchlist", JSON.stringify(updated));
    }

    function removeFromWatchlist(w) {
        const updated = watchlist.filter(x => x !== w);
        setWatchlist(updated);
        localStorage.setItem("watchlist", JSON.stringify(updated));
    }

    function buildChartData(prices) {
        const first = prices[0].price;
        const last  = prices[prices.length - 1].price;
        const isUp  = last >= first;
        const color = isUp ? "#2ecc71" : "#e74c3c";
        const fill  = isUp ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)";
        return {
            labels: prices.map(p => p.date),
            datasets: [{
                data: prices.map(p => p.price),
                borderColor: color, backgroundColor: fill,
                borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true
            }]
        };
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => "$" + ctx.parsed.y.toFixed(2) } }
        },
        scales: {
            x: { ticks: { maxTicksLimit: 6, color: "#7f8c8d" }, grid: { display: false } },
            y: { ticks: { color: "#7f8c8d", callback: val => "$" + val }, grid: { color: "rgba(0,0,0,0.05)" } }
        }
    };

    const isInWatchlist = stockData && watchlist.includes(stockData.ticker);

    return (
        <div>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>

            {/* Watchlist */}
            <div className="watchlist-section">
                <h4 className="watchlist-title">{t.watchlistTitle}</h4>
                {watchlist.length === 0 ? (
                    <p className="watchlist-empty">{t.noWatchlist}</p>
                ) : (
                    <div className="watchlist-tags">
                        {watchlist.map(w => (
                            <div key={w} className="watchlist-tag">
                                <span onClick={() => searchStock(w)} className="watchlist-ticker">{w}</span>
                                <button className="watchlist-remove" onClick={() => removeFromWatchlist(w)}>✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder={t.placeholder}
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <div id="period-buttons">
                {PERIODS.map(p => (
                    <button key={p.value} className={period === p.value ? "active" : ""} onClick={() => setPeriod(p.value)}>
                        {p.label}
                    </button>
                ))}
            </div>

            <button onClick={() => searchStock()} disabled={loading}>
                {t.searchBtn}
            </button>

            {error && <div className="error-box">⚠️ {error}</div>}

            {loading && (
                <div className="loading-wrapper">
                    <div className="spinner" />
                    <p className="loading-text">{t.loading}</p>
                </div>
            )}

            {stockData && (
                <div>
                    <div id="stock-info">
                        <h3 id="stock-name">
                            {stockData.name ? `${stockData.name} (${stockData.ticker})` : stockData.ticker}
                        </h3>
                        <div id="stock-meta">
                            <span className="meta-price">${stockData.price}</span>
                            <span className="meta-stat">{t.high}: ${stockData.high}</span>
                            <span className="meta-stat">{t.low}: ${stockData.low}</span>
                        </div>
                    </div>

                    <div id="chart-container">
                        <Line data={buildChartData(stockData.prices)} options={chartOptions} />
                    </div>

                    {/* Watchlist button */}
                    <button
                        onClick={isInWatchlist ? () => removeFromWatchlist(stockData.ticker) : addToWatchlist}
                        style={{ marginTop: "12px", background: isInWatchlist ? "#f39c12" : "var(--blue)" }}
                    >
                        {isInWatchlist ? `⭐ ${t.removeWatch}` : `⭐ ${t.addWatch}`}
                    </button>

                    {/* News section */}
                    <div style={{ marginTop: "24px" }}>
                        <h4 style={{ color: "var(--text)", marginBottom: "12px" }}>{t.newsTitle}</h4>

                        {newsLoading && (
                            <div className="loading-wrapper">
                                <div className="spinner" />
                            </div>
                        )}

                        {!newsLoading && news.length === 0 && (
                            <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>{t.noNews}</p>
                        )}

                        {!newsLoading && news.length > 0 && (
                            <div className="news-list">
                                {news.map((article, i) => (
                                    <a
                                        key={i}
                                        href={article.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="news-item"
                                    >
                                        <div className="news-meta">
                                            <span className="news-source">{article.source}</span>
                                            <span className="news-date">{article.date}</span>
                                        </div>
                                        <p className="news-headline">{article.headline}</p>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prediction button */}
                    <button onClick={getPrediction} disabled={predicting} style={{ marginTop: "20px" }}>
                        {predicting ? t.predicting : t.predictBtn}
                    </button>

                    {predicting && (
                        <div className="loading-wrapper">
                            <div className="spinner" />
                            <p className="loading-text">{t.predicting}</p>
                            <p className="loading-subtext">{t.predictingNote}</p>
                        </div>
                    )}

                    {prediction && (
                        <div id="results" style={{ marginTop: "16px" }}>
                            <h3>{t.predictionTitle}</h3>
                            <p id="analysis-text">{prediction}</p>
                            <p style={{ fontSize: "0.8rem", color: "#e67e22", marginTop: "12px", fontStyle: "italic" }}>
                                {t.disclaimer}
                            </p>

                            <button className="share-btn" onClick={sharePrediction}>
                                {copied ? t.copied : t.shareBtn}
                            </button>

                            {/* Chat */}
                            <div style={{ marginTop: "24px", borderTop: "1px solid var(--border2)", paddingTop: "16px" }}>
                                <h4 style={{ color: "var(--text)", marginBottom: "12px" }}>💬 {t.chatTitle}</h4>

                                {chatMessages.length > 1 && (
                                    <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px", padding: "4px" }}>
                                        {chatMessages.slice(1).map((msg, i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                                <div style={{
                                                    maxWidth: "80%", padding: "10px 14px",
                                                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                    background: msg.role === "user" ? "var(--blue)" : "var(--surface2)",
                                                    color: msg.role === "user" ? "#ffffff" : "var(--text)",
                                                    fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap"
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                                <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "var(--surface2)", color: "var(--text2)", fontSize: "0.9rem" }}>
                                                    {t.thinking}
                                                </div>
                                            </div>
                                        )}
                                        <div ref={bottomRef} />
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <textarea
                                        rows={2}
                                        placeholder={t.chatPlaceholder}
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={handleChatKeyDown}
                                        style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.95rem", resize: "none", fontFamily: "Arial, sans-serif", backgroundColor: "var(--surface)", color: "var(--text)" }}
                                    />
                                    <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} style={{ alignSelf: "flex-end", margin: 0 }}>
                                        {chatLoading ? t.thinking : t.sendBtn}
                                    </button>
                                </div>
                                <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: "6px" }}>{t.chatHint}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StockLookup;