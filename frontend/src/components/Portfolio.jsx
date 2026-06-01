import { useState, useEffect, useRef } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const BASE_URL = "https://portfolio-ai-e1lf.onrender.com";

const translations = {
    en: {
        title: "Portfolio AI Analyzer",
        subtitle: "Enter your holdings below:",
        ticker: "Ticker (e.g. AAPL)",
        shares: "Shares",
        buyPrice: "Buy Price",
        addBtn: "Add Another Holding",
        analyzeBtn: "Analyze Portfolio",
        analyzing: "Analyzing... ⏳",
        analyzingNote: "This may take a moment while we fetch prices and generate your analysis.",
        analysisTitle: "AI Analysis",
        emptyError: "Please enter at least one valid holding or try again.",
        serverError: "Failed to connect to the server or try again.",
        chatTitle: "Ask a follow-up question",
        chatPlaceholder: "Ask about your portfolio...",
        sendBtn: "Send",
        thinking: "Thinking...",
        chatHint: "Press Enter to send • Shift+Enter for new line",
        shareBtn: "📤 Share Analysis",
        copied: "✅ Copied!",
        historyTitle: "📋 Past Analyses",
        clearHistory: "Clear History",
        noHistory: "No past analyses yet.",
        pieTitle: "Portfolio Breakdown",
        },
    es: {
        title: "Analizador de Portafolio AI",
        subtitle: "Ingresa tus inversiones:",
        ticker: "Ticker (ej. AAPL)",
        shares: "Acciones",
        buyPrice: "Precio de Compra",
        addBtn: "Agregar Otra Inversión",
        analyzeBtn: "Analizar Portafolio",
        analyzing: "Analizando... ⏳",
        analyzingNote: "Esto puede tardar un momento mientras obtenemos los precios y generamos tu análisis.",
        analysisTitle: "Análisis de IA",
        emptyError: "Por favor ingresa al menos una inversión válida o intentarlo de nuevo.",
        serverError: "No se pudo conectar al servidor o intentarlo de nuevo.",
        chatTitle: "Haz una pregunta de seguimiento",
        chatPlaceholder: "Pregunta sobre tu portafolio...",
        sendBtn: "Enviar",
        thinking: "Pensando...",
        chatHint: "Presiona Enter para enviar • Shift+Enter para nueva línea",
        shareBtn: "📤 Compartir Análisis",
        copied: "✅ Copiado!",
        historyTitle: "📋 Análisis Anteriores",
        clearHistory: "Borrar Historial",
        noHistory: "No hay análisis anteriores.",
        pieTitle: "Distribución del Portafolio",
    }
};

const PIE_COLORS = [
    "#3498db", "#2ecc71", "#e74c3c", "#f39c12",
    "#9b59b6", "#1abc9c", "#e67e22", "#34495e"
];

function Portfolio({ lang }) {
    const [holdings, setHoldings]       = useState([{ ticker: "", shares: "", buyPrice: "" }]);
    const [analysis, setAnalysis]       = useState("");
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState("");
    const [copied, setCopied]           = useState(false);
    const [history, setHistory]         = useState([]);
    const [pieData, setPieData]         = useState(null);
    const [fearGreed, setFearGreed]     = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]     = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const bottomRef                     = useRef(null);

    const t = translations[lang] || translations.en;

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("portfolioHistory");
        if (saved) setHistory(JSON.parse(saved));
    }, []);



    useEffect(() => {
        setAnalysis("");
        setChatMessages([]);
        setError("");
    }, [lang]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    function updateHolding(index, field, value) {
        const updated = [...holdings];
        updated[index][field] = value;
        setHoldings(updated);
    }

    function addHolding() {
        setHoldings([...holdings, { ticker: "", shares: "", buyPrice: "" }]);
    }

    function removeHolding(index) {
        const updated = holdings.filter((_, i) => i !== index);
        setHoldings(updated);
    }

    // Enter key shortcut
    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            analyzePortfolio();
        }
    }

    async function analyzePortfolio() {
        const valid = holdings.filter(h => h.ticker && h.shares && h.buyPrice);

        if (valid.length === 0) {
            setError(t.emptyError);
            return;
        }

        setLoading(true);
        setAnalysis("");
        setError("");
        setChatMessages([]);
        setPieData(null);

        const payload = {
            language: lang,
            holdings: valid.map(h => ({
                ticker:   h.ticker.trim().toUpperCase(),
                shares:   parseFloat(h.shares),
                buyPrice: parseFloat(h.buyPrice)
            }))
        };

        try {
            const res  = await fetch(`${BASE_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAnalysis(data.analysis);
                setChatMessages([{ role: "assistant", content: data.analysis }]);

                // Build pie chart data from valid holdings
                const labels  = payload.holdings.map(h => h.ticker);
                const values   = payload.holdings.map(h => h.shares * h.buyPrice);
                setPieData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: PIE_COLORS.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: "#ffffff"
                    }]
                });

                // Save to localStorage history
                const entry = {
                    date:     new Date().toLocaleString(),
                    holdings: payload.holdings,
                    analysis: data.analysis
                };
                const newHistory = [entry, ...history].slice(0, 10); // keep last 10
                setHistory(newHistory);
                localStorage.setItem("portfolioHistory", JSON.stringify(newHistory));
            }

        } catch (err) {
            setError(t.serverError);
        }

        setLoading(false);
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

    function handleChatKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    }

    function shareAnalysis() {
        const lines = holdings
            .filter(h => h.ticker && h.shares && h.buyPrice)
            .map(h => `${h.ticker}: ${h.shares} shares @ $${h.buyPrice}`)
            .join("\n");

        const text = `AIvestor Analysis 📈\n\nPortfolio:\n${lines}\n\nAI Recommendation:\n${analysis}\n\nGenerated by AIvestor\nhttps://portfolio-ai-gamma-indol.vercel.app`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function clearHistory() {
        setHistory([]);
        localStorage.removeItem("portfolioHistory");
    }

    return (
        <div>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>

            {/* Fear & Greed */}
            {fearGreed && (
                <div className="fear-greed-bar" style={{ borderColor: fearGreed.color }}>
                    <span className="fear-greed-label">{t.fearGreedTitle}:</span>
                    <span className="fear-greed-value" style={{ color: fearGreed.color }}>
                        {fearGreed.label} ({fearGreed.score}/100)
                    </span>
                </div>
            )}

            {/* Holding rows */}
            {holdings.map((holding, index) => (
                <div className="holding" key={index} onKeyDown={handleKeyDown}>
                    <input
                        type="text"
                        placeholder={t.ticker}
                        value={holding.ticker}
                        onChange={e => updateHolding(index, "ticker", e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder={t.shares}
                        value={holding.shares}
                        onChange={e => updateHolding(index, "shares", e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder={t.buyPrice}
                        value={holding.buyPrice}
                        onChange={e => updateHolding(index, "buyPrice", e.target.value)}
                    />
                    {holdings.length > 1 && (
                        <button className="remove-btn" onClick={() => removeHolding(index)}>✕</button>
                    )}
                </div>
            ))}

            <button onClick={addHolding}>{t.addBtn}</button>
            <button onClick={analyzePortfolio} disabled={loading}>
                {loading ? t.analyzing : t.analyzeBtn}
            </button>

            {/* Error */}
            {error && (
                <div className="error-box">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="loading-wrapper">
                    <div className="spinner" />
                    <p className="loading-text">{t.analyzing}</p>
                    <p className="loading-subtext">{t.analyzingNote}</p>
                </div>
            )}

            {/* Analysis result */}
            {analysis && (
                <div id="results">
                    <h3>{t.analysisTitle}</h3>
                    <p id="analysis-text">{analysis}</p>

                    {/* Share button */}
                    <button
                        className={`share-btn ${copied ? "copied" : ""}`}
                        onClick={shareAnalysis}
                    >
                        {copied ? t.copied : t.shareBtn}
                    </button>

                    {/* Pie chart */}
                    {pieData && (
                        <div style={{ marginTop: "24px" }}>
                            <h4 style={{ color: "#2c3e50", marginBottom: "12px" }}>
                                🥧 {t.pieTitle}
                            </h4>
                            <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                                <Pie data={pieData} options={{
                                    plugins: {
                                        legend: { position: "bottom" },
                                        tooltip: {
                                            callbacks: {
                                                label: ctx => ` ${ctx.label}: $${ctx.parsed.toLocaleString()}`
                                            }
                                        }
                                    }
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Follow-up chat */}
                    <div style={{ marginTop: "24px", borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
                        <h4 style={{ color: "#2c3e50", marginBottom: "12px" }}>
                            💬 {t.chatTitle}
                        </h4>

                        {chatMessages.length > 1 && (
                            <div style={{
                                maxHeight: "300px", overflowY: "auto",
                                display: "flex", flexDirection: "column",
                                gap: "10px", marginBottom: "12px", padding: "4px"
                            }}>
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

            {/* Portfolio History */}
            {history.length > 0 && (
                <div style={{ marginTop: "40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ color: "#2c3e50" }}>{t.historyTitle}</h3>
                        <button className="remove-btn" onClick={clearHistory}>{t.clearHistory}</button>
                    </div>
                    {history.map((entry, i) => (
                        <div key={i} className="history-card">
                            <p className="history-date">{entry.date}</p>
                            <p className="history-holdings">
                                {entry.holdings.map(h => `${h.ticker} (${h.shares} shares @ $${h.buyPrice})`).join(" • ")}
                            </p>
                            <p className="history-snippet">
                                {entry.analysis.slice(0, 150)}...
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Portfolio;