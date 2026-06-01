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
        loading: "Loading... ⏳",
        high: "Period High",
        low: "Period Low",
        serverError: "Failed to connect to the server.",
        predictBtn: "Predection🔮",
        predicting: "Analyzing... ⏳",
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
        removeWatch: "Remove",
    },
    es: {
        title: "Datos de Acciones",
        subtitle: "Buscar Datos de Acciones:",
        placeholder: "Ingresa un ticker (ej. AAPL)",
        searchBtn: "Buscar",
        loading: "Cargando... ⏳",
        high: "Máximo del Período",
        low: "Mínimo del Período",
        serverError: "No se pudo conectar al servidor.",
        predictBtn: "🤖 Obtener Predicción AI",
        predicting: "Analizando... ⏳",
        predictingNote: "Esto puede tardar un momento mientras la IA analiza los datos.",
        predictionTitle: "Predicción 🔮",
        disclaimer: "⚠️ Esto no es asesoramiento financiero. Las predicciones de IA son solo con fines educativos.",
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
    const [fearGreed, setFearGreed]       = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]       = useState("");
    const [chatLoading, setChatLoading]   = useState(false);
    const bottomRef                       = useRef(null);

    const t = translations[lang] || translations.en;

    // Load watchlist from localStorage
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
        try {
            const res  = await fetch(`${BASE_URL}/news?ticker=${symbol}`);
            const data = await res.json();
            if (!data.error) setNews(data.articles || []);
        } catch {}
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

    function removeFromWatchlist(t) {
        const updated = watchlist.filter(w => w !== t);
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
                {loading ? t.loading : t.searchBtn}
            </button>

            {/* Error */}
            {error && <div className="error-box"><span>⚠️</span> {error}</div>}

            {/* Loading spinner */}
            {loading && (
                <div className="loading-wrapper">
                    <div className="spinner" />
                    <p className="loading-text">{t.loading}</p>
                </div>
            )}

            {/* Stock info + graph */}
            {stockData && (
                <div>
                    <div id="stock-info">
                        <h3 id="stock-name">{stockData.name} ({stockData.ticker})</h3>
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
                        style={{ marginTop: "12px", background: isInWatchlist ? "#f39c12" : "#3498db" }}
                    >
                        {isInWatchlist ? `⭐ ${t.removeWatch}` : `⭐ ${t.addWatch}`}
                    </button>

                    {/* Prediction button */}
                    <button onClick={getPrediction} disabled={predicting} style={{ marginTop: "20px" }}>
                        {predicting ? t.predicting : t.predictBtn}
                    </button>

                    {/* Predicting spinner */}
                    {predicting && (
                        <div className="loading-wrapper">
                            <div className="spinner" />
                            <p className="loading-text">{t.predicting}</p>
                            <p className="loading-subtext">{t.predictingNote}</p>
                        </div>
                    )}

                    {/* Prediction result */}
                    {prediction && (
                        <div id="results" style={{ marginTop: "16px" }}>
                            <h3>{t.predictionTitle}</h3>
                            <p id="analysis-text">{prediction}</p>
                            <p style={{ fontSize: "0.8rem", color: "#e67e22", marginTop: "12px", fontStyle: "italic" }}>
                                {t.disclaimer}
                            </p>

                            {/* Share button */}
                            <button className={`share-btn ${copied ? "copied" : ""}`} onClick={sharePrediction}>
                                {copied ? t.copied : t.shareBtn}
                            </button>

                            {/* Chat */}
                            <div style={{ marginTop: "24px", borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
                                <h4 style={{ color: "#2c3e50", marginBottom: "12px" }}>💬 {t.chatTitle}</h4>

                                {chatMessages.length > 1 && (
                                    <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px", padding: "4px" }}>
                                        {chatMessages.slice(1).map((msg, i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                                <div style={{
                                                    maxWidth: "80%", padding: "10px 14px",
                                                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                    background: msg.role === "user" ? "#3498db" : "#f0f2f5",
                                                    color: msg.role === "user" ? "#ffffff" : "#2c3e50",
                                                    fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap"
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                                <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#f0f2f5", color: "#7f8c8d", fontSize: "0.9rem" }}>
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
                                        style={{ flex: 1, padding: "10px 12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "0.95rem", resize: "none", fontFamily: "Arial, sans-serif" }}
                                    />
                                    <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} style={{ alignSelf: "flex-end", margin: 0 }}>
                                        {chatLoading ? t.thinking : t.sendBtn}
                                    </button>
                                </div>
                                <p style={{ fontSize: "0.78rem", color: "#95a5a6", marginTop: "6px" }}>{t.chatHint}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StockLookup;