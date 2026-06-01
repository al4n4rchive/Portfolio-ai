import { useState, useRef, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

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
        serverError: "Failed to connect to the server. Please try again.",
        predictBtn: "🔮 Predict Future Price",
        predicting: "Predicting...",
        predictionTitle: "AI Price Prediction",
        predictionSubtitle: "Based on historical data — not financial advice.",
        shareBtn: "📋 Copy Prediction",
        shareCopied: "✅ Copied!",
        chatTitle: "Ask a follow-up question",
        chatPlaceholder: "Ask about this stock...",
        sendBtn: "Send",
        thinking: "Thinking...",
        chatHint: "Press Enter to send • Shift+Enter for new line",
    },
    es: {
        title: "Datos de Acciones",
        subtitle: "Buscar Datos de Acciones:",
        placeholder: "Ingresa un ticker (ej. AAPL)",
        searchBtn: "Buscar",
        loading: "Cargando...",
        high: "Máximo del Período",
        low: "Mínimo del Período",
        serverError: "No se pudo conectar al servidor. Intenta de nuevo.",
        predictBtn: "🔮 Predecir Precio Futuro",
        predicting: "Prediciendo...",
        predictionTitle: "Predicción de Precio AI",
        predictionSubtitle: "Basado en datos históricos — no es asesoramiento financiero.",
        shareBtn: "📋 Copiar Predicción",
        shareCopied: "✅ ¡Copiado!",
        chatTitle: "Haz una pregunta de seguimiento",
        chatPlaceholder: "Pregunta sobre esta acción...",
        sendBtn: "Enviar",
        thinking: "Pensando...",
        chatHint: "Presiona Enter para enviar • Shift+Enter para nueva línea",
    }
};

function StockLookup({ lang }) {
    const [ticker, setTicker]           = useState("");
    const [period, setPeriod]           = useState("1mo");
    const [stockData, setStockData]     = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState("");
    const [prediction, setPrediction]   = useState("");
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError]     = useState("");
    const [copied, setCopied]           = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]       = useState("");
    const [chatLoading, setChatLoading]   = useState(false);
    const bottomRef = useRef(null);

    const t = translations[lang] || translations.en;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    async function searchStock() {
        const symbol = ticker.trim().toUpperCase();
        if (!symbol) return;

        setLoading(true);
        setError("");
        setStockData(null);
        setPrediction("");
        setPredError("");
        setChatMessages([]);

        try {
            const res = await fetch(
                `https://portfolio-ai-e1lf.onrender.com/stock_lookup?ticker=${symbol}&period=${period}`
            );
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setStockData(data);
            }

        } catch (err) {
            setError(t.serverError);
        }

        setLoading(false);
    }

    async function predictPrice() {
        if (!stockData) return;

        setPredLoading(true);
        setPrediction("");
        setPredError("");
        setChatMessages([]);

        try {
            const res = await fetch("https://portfolio-ai-e1lf.onrender.com/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: lang,
                    ticker: stockData.ticker,
                    name: stockData.name,
                    current_price: stockData.price,
                    high: stockData.high,
                    low: stockData.low,
                    period: stockData.period,
                    prices: stockData.prices
                })
            });

            const data = await res.json();

            if (data.error) {
                setPredError(data.error);
            } else {
                setPrediction(data.prediction);
                // Seed chat with prediction as context
                setChatMessages([
                    { role: "assistant", content: data.prediction }
                ]);
            }

        } catch (err) {
            setPredError(t.serverError);
        }

        setPredLoading(false);
    }

    async function sendChatMessage() {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        const userMessage = { role: "user", content: text };
        const updatedMessages = [...chatMessages, userMessage];

        setChatMessages(updatedMessages);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await fetch("https://portfolio-ai-e1lf.onrender.com/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: lang,
                    messages: updatedMessages
                })
            });

            const data = await res.json();

            setChatMessages([...updatedMessages, {
                role: "assistant",
                content: data.error ? "Error: " + data.error : data.reply
            }]);

        } catch (err) {
            setChatMessages([...updatedMessages, {
                role: "assistant",
                content: t.serverError
            }]);
        }

        setChatLoading(false);
    }

    function handleChatKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    }

    function copyPrediction() {
        navigator.clipboard.writeText(prediction).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") searchStock();
    }

    function buildChartData(prices) {
        const first  = prices[0].price;
        const last   = prices[prices.length - 1].price;
        const isUp   = last >= first;
        const color  = isUp ? "#2ecc71" : "#e74c3c";
        const fill   = isUp ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)";

        return {
            labels: prices.map(p => p.date),
            datasets: [{
                data:            prices.map(p => p.price),
                borderColor:     color,
                backgroundColor: fill,
                borderWidth:     2,
                pointRadius:     0,
                tension:         0.3,
                fill:            true
            }]
        };
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => "$" + ctx.parsed.y.toFixed(2)
                }
            }
        },
        scales: {
            x: {
                ticks: { maxTicksLimit: 6, color: "#7f8c8d" },
                grid:  { display: false }
            },
            y: {
                ticks: {
                    color: "#7f8c8d",
                    callback: val => "$" + val
                },
                grid: { color: "rgba(0,0,0,0.05)" }
            }
        }
    };

    return (
        <div>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>

            <input
                type="text"
                placeholder={t.placeholder}
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <div id="period-buttons">
                {PERIODS.map(p => (
                    <button
                        key={p.value}
                        className={period === p.value ? "active" : ""}
                        onClick={() => setPeriod(p.value)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <button onClick={searchStock} disabled={loading}>
                {t.searchBtn}
            </button>

            {/* Loading spinner */}
            {loading && (
                <div className="spinner-wrapper">
                    <div className="spinner" />
                    {t.loading}
                </div>
            )}

            {/* Error box */}
            {error && <div className="error-box">⚠️ {error}</div>}

            {stockData && (
                <div>
                    <div id="stock-info">
                        <h3 id="stock-name">
                            {stockData.name} ({stockData.ticker})
                        </h3>
                        <div id="stock-meta">
                            <span className="meta-price">${stockData.price}</span>
                            <span className="meta-stat">{t.high}: ${stockData.high}</span>
                            <span className="meta-stat">{t.low}: ${stockData.low}</span>
                        </div>
                    </div>

                    <div id="chart-container">
                        <Line
                            data={buildChartData(stockData.prices)}
                            options={chartOptions}
                        />
                    </div>

                    {/* Prediction section */}
                    <div style={{ marginTop: "24px" }}>
                        <button
                            onClick={predictPrice}
                            disabled={predLoading}
                            style={{ backgroundColor: "var(--purple)" }}
                        >
                            {predLoading ? t.predicting : t.predictBtn}
                        </button>

                        {predLoading && (
                            <div className="spinner-wrapper">
                                <div className="spinner" style={{ borderTopColor: "var(--purple)" }} />
                                {t.predicting}
                            </div>
                        )}

                        {predError && <div className="error-box">⚠️ {predError}</div>}

                        {prediction && (
                            <div id="results" style={{ marginTop: "16px", borderLeft: "5px solid var(--purple)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                    <h3 style={{ margin: 0 }}>{t.predictionTitle}</h3>
                                    <button className="share-btn" onClick={copyPrediction}>
                                        {copied ? t.shareCopied : t.shareBtn}
                                    </button>
                                </div>
                                <p style={{
                                    fontSize: "0.78rem",
                                    color: "var(--text3)",
                                    margin: "8px 0 12px",
                                    fontStyle: "italic"
                                }}>
                                    ⚠️ {t.predictionSubtitle}
                                </p>
                                <p id="analysis-text">{prediction}</p>

                                {/* Follow-up chat after prediction */}
                                <div style={{
                                    marginTop: "24px",
                                    borderTop: "1px solid var(--border2)",
                                    paddingTop: "16px"
                                }}>
                                    <h4 style={{ margin: "0 0 12px 0" }}>
                                        💬 {t.chatTitle}
                                    </h4>

                                    {chatMessages.length > 1 && (
                                        <div style={{
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "10px",
                                            marginBottom: "12px",
                                            padding: "4px"
                                        }}>
                                            {chatMessages.slice(1).map((msg, i) => (
                                                <div key={i} style={{
                                                    display: "flex",
                                                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                                                }}>
                                                    <div style={{
                                                        maxWidth: "80%",
                                                        padding: "10px 14px",
                                                        borderRadius: msg.role === "user"
                                                            ? "16px 16px 4px 16px"
                                                            : "16px 16px 16px 4px",
                                                        background: msg.role === "user" ? "var(--blue)" : "var(--surface2)",
                                                        color: msg.role === "user" ? "#ffffff" : "var(--text)",
                                                        fontSize: "0.9rem",
                                                        lineHeight: "1.5",
                                                        whiteSpace: "pre-wrap"
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}

                                            {chatLoading && (
                                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                                    <div style={{
                                                        padding: "10px 14px",
                                                        borderRadius: "16px 16px 16px 4px",
                                                        background: "var(--surface2)",
                                                        color: "var(--text2)",
                                                        fontSize: "0.9rem"
                                                    }}>
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
                                            style={{
                                                flex: 1,
                                                padding: "10px 12px",
                                                border: "1px solid var(--border)",
                                                borderRadius: "6px",
                                                fontSize: "0.95rem",
                                                resize: "none",
                                                fontFamily: "Arial, sans-serif",
                                                backgroundColor: "var(--surface)",
                                                color: "var(--text)"
                                            }}
                                        />
                                        <button
                                            onClick={sendChatMessage}
                                            disabled={chatLoading || !chatInput.trim()}
                                            style={{ alignSelf: "flex-end", margin: 0 }}
                                        >
                                            {chatLoading ? t.thinking : t.sendBtn}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: "6px" }}>
                                        {t.chatHint}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StockLookup;