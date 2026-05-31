import { useState, useEffect } from "react";

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
        analysisTitle: "AI Analysis",
        emptyError: "Please enter at least one valid holding.",
        serverError: "Failed to connect to the server.",
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
        analysisTitle: "Análisis de IA",
        emptyError: "Por favor ingresa al menos una inversión válida.",
        serverError: "No se pudo conectar al servidor.",
    }
};

function Portfolio({ lang }) {
    const [holdings, setHoldings] = useState([
        { ticker: "", shares: "", buyPrice: "" }
    ]);
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

    const t = translations[lang] || translations.en;

    // Clear analysis when language changes
    useEffect(() => {
        setAnalysis("");
    }, [lang]);

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

    async function analyzePortfolio() {
        const valid = holdings.filter(
            h => h.ticker && h.shares && h.buyPrice
        );

        if (valid.length === 0) {
            setAnalysis(t.emptyError);
            return;
        }

        setLoading(true);
        setAnalysis("");

        const payload = {
            language: lang,
            holdings: valid.map(h => ({
                ticker:   h.ticker.trim().toUpperCase(),
                shares:   parseFloat(h.shares),
                buyPrice: parseFloat(h.buyPrice)
            }))
        };

        console.log("Sending to backend:", payload);

        try {
            const res = await fetch("https://portfolio-ai-e1lf.onrender.com/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.error) {
                setAnalysis("Error: " + data.error);
            } else {
                setAnalysis(data.analysis);
            }

        } catch (err) {
            setAnalysis(t.serverError);
        }

        setLoading(false);
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
                {loading ? t.analyzing : t.analyzeBtn}
            </button>

            {analysis && (
                <div id="results">
                    <h3>{t.analysisTitle}</h3>
                    <p id="analysis-text">{analysis}</p>
                </div>
            )}
        </div>
    );
}

export default Portfolio;