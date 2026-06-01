import { useState, useEffect, useRef } from "react";

const translations = {
    en: {
        title: "Portfolio AI Analyzer",
        subtitle: "Enter your holdings below:",
        ticker: "Ticker (e.g. AAPL)",
        shares: "Shares",
        buyPrice: "Buy Price",
        addBtn: "Add Another Holding",
        analyzeBtn: "Analyze Portfolio",
        analyzing: "Analyzing...",
        analysisTitle: "AI Analysis",
        emptyError: "Please enter at least one valid holding.",
        serverError: "Failed to connect to the server. Please try again.",
        chatTitle: "Ask a follow-up question",
        chatPlaceholder: "Ask about your portfolio...",
        sendBtn: "Send",
        thinking: "Thinking...",
        chatHint: "Press Enter to send • Shift+Enter for new line",
        shareBtn: "📋 Copy Analysis",
        shareCopied: "✅ Copied!",
    },
    es: {
        title: "Analizador de Portafolio AI",
        subtitle: "Ingresa tus inversiones:",
        ticker: "Ticker (ej. AAPL)",
        shares: "Acciones",
        buyPrice: "Precio de Compra",
        addBtn: "Agregar Otra Inversión",
        analyzeBtn: "Analizar Portafolio",
        analyzing: "Analizando...",
        analysisTitle: "Análisis de IA",
        emptyError: "Por favor ingresa al menos una inversión válida.",
        serverError: "No se pudo conectar al servidor. Intenta de nuevo.",
        chatTitle: "Haz una pregunta de seguimiento",
        chatPlaceholder: "Pregunta sobre tu portafolio...",
        sendBtn: "Enviar",
        thinking: "Pensando...",
        chatHint: "Presiona Enter para enviar • Shift+Enter para nueva línea",
        shareBtn: "📋 Copiar Análisis",
        shareCopied: "✅ ¡Copiado!",
    }
};

function Portfolio({ lang }) {
    const [holdings, setHoldings] = useState([
        { ticker: "", shares: "", buyPrice: "" }
    ]);
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const bottomRef = useRef(null);

    const t = translations[lang] || translations.en;

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

    function copyAnalysis() {
        navigator.clipboard.writeText(analysis).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    async function analyzePortfolio() {
        const valid = holdings.filter(
            h => h.ticker && h.shares && h.buyPrice
        );

        if (valid.length === 0) {
            setError(t.emptyError);
            return;
        }

        setLoading(true);
        setAnalysis("");
        setError("");
        setChatMessages([]);

        const payload = {
            language: lang,
            holdings: valid.map(h => ({
                ticker:   h.ticker.trim().toUpperCase(),
                shares:   parseFloat(h.shares),
                buyPrice: parseFloat(h.buyPrice)
            }))
        };

        try {
            const res = await fetch("https://portfolio-ai-e1lf.onrender.com/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAnalysis(data.analysis);
                setChatMessages([
                    { role: "assistant", content: data.analysis }
                ]);
            }

        } catch (err) {
            setError(t.serverError);
        }

        setLoading(false);
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

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    }

    return (
        <div>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>

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
                    {holdings.length > 1 && (
                        <button className="remove-btn" onClick={() => removeHolding(index)}>
                            ✕
                        </button>
                    )}
                </div>
            ))}

            <button onClick={addHolding}>{t.addBtn}</button>
            <button onClick={analyzePortfolio} disabled={loading}>
                {t.analyzeBtn}
            </button>

            {/* Loading spinner */}
            {loading && (
                <div className="spinner-wrapper">
                    <div className="spinner" />
                    {t.analyzing}
                </div>
            )}

            {/* Error box */}
            {error && <div className="error-box">⚠️ {error}</div>}

            {/* AI Analysis + Follow-up Chat */}
            {analysis && (
                <div id="results">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <h3 style={{ margin: 0 }}>{t.analysisTitle}</h3>
                        <button className="share-btn" onClick={copyAnalysis}>
                            {copied ? t.shareCopied : t.shareBtn}
                        </button>
                    </div>
                    <p id="analysis-text" style={{ marginTop: "12px" }}>{analysis}</p>

                    {/* Follow-up chat */}
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
                                onKeyDown={handleKeyDown}
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
    );
}

export default Portfolio;