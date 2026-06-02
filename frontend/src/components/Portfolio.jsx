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
        buyDate: "Buy Date (optional)",
        addBtn: "Add Another Holding",
        analyzeBtn: "Analyze Portfolio",
        analyzing: "Analyzing... ⏳",
        analyzingNote: "This may take a moment while we fetch prices and generate your analysis.",
        analysisTitle: "AI Analysis",
        emptyError: "Please enter at least one valid holding.",
        serverError: "Failed to connect to the server.",
        chatTitle: "Ask a follow-up question",
        chatPlaceholder: "Ask about your portfolio...",
        sendBtn: "Send",
        thinking: "Thinking...",
        chatHint: "Press Enter to send • Shift+Enter for new line",
        shareBtn: "📤 Share Analysis",
        shareLinkBtn: "🔗 Share Link",
        shareLinkCopied: "✅ Link Copied!",
        copied: "✅ Copied!",
        historyTitle: "📋 Past Analyses",
        clearHistory: "Clear History",
        pieTitle: "Portfolio Breakdown",
        sectorTitle: "Sector Exposure",
        fearGreedTitle: "Market Sentiment",
        showFull: "Read Full Analysis ▼",
        hideFull: "Collapse ▲",
        continueChat: "Continue Chat ▼",
        totalValue: "Total Value",
        gainLoss: "Gain / Loss",
        portfolioReturn: "Return",
        sp500Return: "vs S&P 500",
        divScore: "Diversification",
        beatMarket: "🏆 Beat the Market!",
        lostMarket: "📉 Underperformed S&P 500",
    },
    es: {
        title: "Analizador de Portafolio AI",
        subtitle: "Ingresa tus inversiones:",
        ticker: "Ticker (ej. AAPL)",
        shares: "Acciones",
        buyPrice: "Precio de Compra",
        buyDate: "Fecha de Compra (opcional)",
        addBtn: "Agregar Otra Inversión",
        analyzeBtn: "Analizar Portafolio",
        analyzing: "Analizando... ⏳",
        analyzingNote: "Esto puede tardar un momento.",
        analysisTitle: "Análisis de IA",
        emptyError: "Por favor ingresa al menos una inversión válida.",
        serverError: "No se pudo conectar al servidor.",
        chatTitle: "Haz una pregunta de seguimiento",
        chatPlaceholder: "Pregunta sobre tu portafolio...",
        sendBtn: "Enviar",
        thinking: "Pensando...",
        chatHint: "Presiona Enter para enviar • Shift+Enter para nueva línea",
        shareBtn: "📤 Compartir Análisis",
        shareLinkBtn: "🔗 Compartir Link",
        shareLinkCopied: "✅ ¡Link Copiado!",
        copied: "✅ Copiado!",
        historyTitle: "📋 Análisis Anteriores",
        clearHistory: "Borrar Historial",
        pieTitle: "Distribución del Portafolio",
        sectorTitle: "Exposición por Sector",
        fearGreedTitle: "Sentimiento del Mercado",
        showFull: "Leer Análisis Completo ▼",
        hideFull: "Colapsar ▲",
        continueChat: "Continuar Chat ▼",
        totalValue: "Valor Total",
        gainLoss: "Ganancia / Pérdida",
        portfolioReturn: "Retorno",
        sp500Return: "vs S&P 500",
        divScore: "Diversificación",
        beatMarket: "🏆 ¡Superó al Mercado!",
        lostMarket: "📉 Por debajo del S&P 500",
    }
};

const PIE_COLORS = [
    "#3498db", "#2ecc71", "#e74c3c", "#f39c12",
    "#9b59b6", "#1abc9c", "#e67e22", "#34495e"
];

function MetricCard({ label, value, sub, color }) {
    return (
        <div className="metric-card">
            <p className="metric-label">{label}</p>
            <p className="metric-value" style={{ color: color || "var(--text)" }}>{value}</p>
            {sub && <p className="metric-sub">{sub}</p>}
        </div>
    );
}

function Portfolio({ lang }) {
    const [holdings, setHoldings]                 = useState([{ ticker: "", shares: "", buyPrice: "", buyDate: "" }]);
    const [analysis, setAnalysis]                 = useState("");
    const [metrics, setMetrics]                   = useState(null);
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState("");
    const [copied, setCopied]                     = useState(false);
    const [linkCopied, setLinkCopied]             = useState(false);
    const [history, setHistory]                   = useState([]);
    const [expandedIndex, setExpandedIndex]       = useState(null);
    const [chatExpandedIndex, setChatExpandedIndex] = useState(null);
    const [pieData, setPieData]                   = useState(null);
    const [holdingsPieData, setHoldingsPieData]   = useState(null);
    const [fearGreed, setFearGreed]               = useState(null);
    const [chatMessages, setChatMessages]         = useState([]);
    const [chatInput, setChatInput]               = useState("");
    const [chatLoading, setChatLoading]           = useState(false);
    const bottomRef                               = useRef(null);

    const t = translations[lang] || translations.en;

    useEffect(() => {
        const saved = localStorage.getItem("portfolioHistory");
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        fetch(`${BASE_URL}/fear_greed`)
            .then(r => r.json())
            .then(data => { if (!data.error) setFearGreed(data); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        setAnalysis("");
        setChatMessages([]);
        setError("");
        setMetrics(null);
    }, [lang]);

    // Auto-load holdings from share URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shared = params.get("s");
        if (shared) {
            try {
                const decoded = JSON.parse(atob(shared));
                if (decoded.holdings && decoded.holdings.length > 0) {
                    setHoldings(decoded.holdings);
                    // Auto-analyze after a short delay
                    setTimeout(() => {
                        window.history.replaceState({}, "", window.location.pathname);
                    }, 100);
                }
            } catch (e) {
                console.error("Invalid share link");
            }
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    function updateHolding(index, field, value) {
        const updated = [...holdings];
        updated[index][field] = value;
        setHoldings(updated);
    }

    function addHolding() {
        setHoldings([...holdings, { ticker: "", shares: "", buyPrice: "", buyDate: "" }]);
    }

    function removeHolding(index) {
        const updated = holdings.filter((_, i) => i !== index);
        setHoldings(updated);
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
        setHoldingsPieData(null);
        setMetrics(null);

        const payload = {
            language: lang,
            holdings: valid.map(h => ({
                ticker:   h.ticker.trim().toUpperCase(),
                shares:   parseFloat(h.shares),
                buyPrice: parseFloat(h.buyPrice),
                buyDate:  h.buyDate || ""
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

                const m = {
                    totalValue:           data.totalValue,
                    totalCost:            data.totalCost,
                    gainLoss:             data.gainLoss,
                    portfolioReturn:      data.portfolioReturn,
                    sp500Return:          data.sp500Return,
                    beatMarket:           data.beatMarket,
                    sectors:              data.sectors,
                    diversificationScore: data.diversificationScore
                };
                setMetrics(m);

                // Holdings pie chart
                const hLabels = payload.holdings.map(h => h.ticker);
                const hValues = payload.holdings.map(h => h.shares * h.buyPrice);
                setHoldingsPieData({
                    labels: hLabels,
                    datasets: [{
                        data: hValues,
                        backgroundColor: PIE_COLORS.slice(0, hLabels.length),
                        borderWidth: 2,
                        borderColor: "#ffffff"
                    }]
                });

                // Sector pie chart
                if (data.sectors) {
                    const labels = Object.keys(data.sectors);
                    const values = Object.values(data.sectors);
                    setPieData({
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: PIE_COLORS.slice(0, labels.length),
                            borderWidth: 2,
                            borderColor: "#ffffff"
                        }]
                    });
                }

                const entry = {
                    date:         new Date().toLocaleString(),
                    holdings:     payload.holdings,
                    analysis:     data.analysis,
                    metrics:      m,
                    chatMessages: [{ role: "assistant", content: data.analysis }]
                };
                const newHistory = [entry, ...history].slice(0, 10);
                setHistory(newHistory);
                localStorage.setItem("portfolioHistory", JSON.stringify(newHistory));
            }

        } catch (err) {
            setError(t.serverError);
        }

        setLoading(false);
    }

    async function sendChatMessage(overrideMessages) {
        const text = chatInput.trim();
        if (!text || chatLoading) return;

        const base            = overrideMessages || chatMessages;
        const userMessage     = { role: "user", content: text };
        const updatedMessages = [...base, userMessage];

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

            const finalMessages = [...updatedMessages, {
                role: "assistant",
                content: data.error ? "Error: " + data.error : data.reply
            }];

            setChatMessages(finalMessages);

            if (expandedIndex !== null) {
                const newHistory = [...history];
                newHistory[expandedIndex].chatMessages = finalMessages;
                setHistory(newHistory);
                localStorage.setItem("portfolioHistory", JSON.stringify(newHistory));
            }

        } catch {
            setChatMessages(prev => [...prev, { role: "assistant", content: t.serverError }]);
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

        const metricsLine = metrics
            ? `\nTotal Value: $${metrics.totalValue?.toLocaleString()} | Return: ${metrics.portfolioReturn}% | vs S&P 500: ${metrics.sp500Return}%`
            : "";

        const text = `AIvestor Analysis 📈\n\nPortfolio:\n${lines}${metricsLine}\n\nAI Recommendation:\n${analysis}\n\nGenerated by AIvestor\nhttps://portfolio-ai-gamma-indol.vercel.app`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function shareLink() {
        const valid = holdings.filter(h => h.ticker && h.shares && h.buyPrice);
        if (valid.length === 0) return;

        const payload = {
            holdings: valid.map(h => ({
                ticker:   h.ticker.trim().toUpperCase(),
                shares:   h.shares,
                buyPrice: h.buyPrice,
                buyDate:  h.buyDate || ""
            }))
        };

        const encoded = btoa(JSON.stringify(payload));
        const url     = `${window.location.origin}${window.location.pathname}?s=${encoded}`;

        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    }

    function clearHistory() {
        setHistory([]);
        setExpandedIndex(null);
        setChatExpandedIndex(null);
        localStorage.removeItem("portfolioHistory");
    }

    function toggleExpand(index) {
        if (expandedIndex === index) {
            setExpandedIndex(null);
            setChatExpandedIndex(null);
            setChatMessages([]);
        } else {
            setExpandedIndex(index);
            setChatExpandedIndex(null);
            const saved = history[index].chatMessages || [];
            setChatMessages(saved);
        }
    }

    function toggleChatExpand(index) {
        setChatExpandedIndex(chatExpandedIndex === index ? null : index);
    }

    const gainColor = (val) => val >= 0 ? "#27ae60" : "#e74c3c";

    const pieOptions = (isCurrency) => ({
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: ctx => isCurrency
                        ? ` ${ctx.label}: $${ctx.parsed.toLocaleString()}`
                        : ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`
                }
            }
        }
    });

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
                <div className="holding" key={index}>
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
                    <input
                        type="date"
                        value={holding.buyDate}
                        onChange={e => updateHolding(index, "buyDate", e.target.value)}
                        style={{ flex: 1 }}
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

            {error && <div className="error-box">⚠️ {error}</div>}

            {loading && (
                <div className="loading-wrapper">
                    <div className="spinner" />
                    <p className="loading-text">{t.analyzing}</p>
                    <p className="loading-subtext">{t.analyzingNote}</p>
                </div>
            )}

            {/* Metric cards */}
            {metrics && (
                <div className="metrics-grid">
                    <MetricCard
                        label={t.totalValue}
                        value={`$${metrics.totalValue?.toLocaleString()}`}
                        sub={`Cost: $${metrics.totalCost?.toLocaleString()}`}
                    />
                    <MetricCard
                        label={t.gainLoss}
                        value={`${metrics.gainLoss >= 0 ? "+" : ""}$${metrics.gainLoss?.toLocaleString()}`}
                        color={gainColor(metrics.gainLoss)}
                    />
                    <MetricCard
                        label={t.portfolioReturn}
                        value={`${metrics.portfolioReturn >= 0 ? "+" : ""}${metrics.portfolioReturn}%`}
                        color={gainColor(metrics.portfolioReturn)}
                    />
                    {metrics.sp500Return !== null && (
                        <MetricCard
                            label={t.sp500Return}
                            value={`${metrics.portfolioReturn >= 0 ? "+" : ""}${metrics.portfolioReturn}% vs ${metrics.sp500Return >= 0 ? "+" : ""}${metrics.sp500Return}%`}
                            sub={metrics.beatMarket ? t.beatMarket : t.lostMarket}
                            color={metrics.beatMarket ? "#27ae60" : "#e74c3c"}
                        />
                    )}
                    <MetricCard
                        label={t.divScore}
                        value={`${metrics.diversificationScore}/100`}
                        color={metrics.diversificationScore >= 60 ? "#27ae60" : metrics.diversificationScore >= 40 ? "#f39c12" : "#e74c3c"}
                    />
                </div>
            )}

            {/* Analysis result */}
            {analysis && (
                <div id="results">
                    <h3>{t.analysisTitle}</h3>
                    <p id="analysis-text">{analysis}</p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                        <button className="share-btn" onClick={shareAnalysis}>
                            {copied ? t.copied : t.shareBtn}
                        </button>
                        <button className="share-btn" onClick={shareLink} style={{ backgroundColor: "#8e44ad" }}>
                            {linkCopied ? t.shareLinkCopied : t.shareLinkBtn}
                        </button>
                    </div>

                    {/* Holdings pie chart */}
                    {holdingsPieData && (
                        <div style={{ marginTop: "24px" }}>
                            <h4 style={{ color: "var(--text)", marginBottom: "12px" }}>🥧 {t.pieTitle}</h4>
                            <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                                <Pie data={holdingsPieData} options={pieOptions(true)} />
                            </div>
                        </div>
                    )}

                    {/* Sector pie chart */}
                    {pieData && (
                        <div style={{ marginTop: "24px" }}>
                            <h4 style={{ color: "var(--text)", marginBottom: "12px" }}>🥧 {t.sectorTitle}</h4>
                            <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                                <Pie data={pieData} options={pieOptions(false)} />
                            </div>
                        </div>
                    )}

                    {/* Follow-up chat */}
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
                            <button onClick={() => sendChatMessage()} disabled={chatLoading || !chatInput.trim()} style={{ alignSelf: "flex-end", margin: 0 }}>
                                {chatLoading ? t.thinking : t.sendBtn}
                            </button>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: "6px" }}>{t.chatHint}</p>
                    </div>
                </div>
            )}

            {/* Portfolio History */}
            {history.length > 0 && (
                <div style={{ marginTop: "40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3>{t.historyTitle}</h3>
                        <button className="remove-btn" onClick={clearHistory}>{t.clearHistory}</button>
                    </div>

                    {history.map((entry, i) => (
                        <div key={i} className="history-card">
                            <p className="history-date">{entry.date}</p>
                            <p className="history-holdings">
                                {entry.holdings.map(h => `${h.ticker} (${h.shares} shares @ $${h.buyPrice})`).join(" • ")}
                            </p>

                            {entry.metrics && (
                                <div className="history-metrics">
                                    <span style={{ color: gainColor(entry.metrics.gainLoss) }}>
                                        {entry.metrics.portfolioReturn >= 0 ? "+" : ""}{entry.metrics.portfolioReturn}%
                                    </span>
                                    <span> · ${entry.metrics.totalValue?.toLocaleString()}</span>
                                    {entry.metrics.sp500Return !== null && (
                                        <span style={{ color: entry.metrics.beatMarket ? "#27ae60" : "#e74c3c" }}>
                                            {" · "}{entry.metrics.beatMarket ? "🏆 Beat S&P 500" : "📉 Below S&P 500"}
                                        </span>
                                    )}
                                </div>
                            )}

                            {expandedIndex !== i && (
                                <p className="history-snippet">{entry.analysis.slice(0, 150)}...</p>
                            )}

                            {expandedIndex === i && (
                                <>
                                    <p className="history-full-analysis">{entry.analysis}</p>

                                    <button className="history-toggle-btn" onClick={() => toggleChatExpand(i)}>
                                        {chatExpandedIndex === i ? "Hide Chat ▲" : t.continueChat}
                                    </button>

                                    {chatExpandedIndex === i && (
                                        <div style={{ marginTop: "12px" }}>
                                            {chatMessages.length > 1 && (
                                                <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                                                    {chatMessages.slice(1).map((msg, j) => (
                                                        <div key={j} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                                            <div style={{
                                                                maxWidth: "80%", padding: "8px 12px",
                                                                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                                background: msg.role === "user" ? "var(--blue)" : "var(--surface2)",
                                                                color: msg.role === "user" ? "#fff" : "var(--text)",
                                                                fontSize: "0.85rem", whiteSpace: "pre-wrap"
                                                            }}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {chatLoading && (
                                                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                                            <div style={{ padding: "8px 12px", borderRadius: "16px 16px 16px 4px", background: "var(--surface2)", color: "var(--text2)", fontSize: "0.85rem" }}>
                                                                {t.thinking}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div ref={bottomRef} />
                                                </div>
                                            )}
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <textarea
                                                    rows={2}
                                                    placeholder={t.chatPlaceholder}
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            sendChatMessage(chatMessages);
                                                        }
                                                    }}
                                                    style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.9rem", resize: "none", fontFamily: "Arial, sans-serif", backgroundColor: "var(--surface)", color: "var(--text)" }}
                                                />
                                                <button onClick={() => sendChatMessage(chatMessages)} disabled={chatLoading || !chatInput.trim()} style={{ alignSelf: "flex-end", margin: 0 }}>
                                                    {chatLoading ? t.thinking : t.sendBtn}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <button className="history-toggle-btn" onClick={() => toggleExpand(i)}>
                                {expandedIndex === i ? t.hideFull : t.showFull}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Portfolio;