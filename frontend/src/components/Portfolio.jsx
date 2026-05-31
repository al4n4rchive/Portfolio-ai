import { useState } from "react";

function Portfolio() {
    // holdings is an array of { ticker, shares, buyPrice }
    const [holdings, setHoldings] = useState([
        { ticker: "", shares: "", buyPrice: "" }
    ]);
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

    // Update a specific field in a specific holding row
    function updateHolding(index, field, value) {
        const updated = [...holdings];
        updated[index][field] = value;
        setHoldings(updated);
    }

    // Add a new empty holding row
    function addHolding() {
        setHoldings([...holdings, { ticker: "", shares: "", buyPrice: "" }]);
    }

    // Remove a holding row by index
    function removeHolding(index) {
        const updated = holdings.filter((_, i) => i !== index);
        setHoldings(updated);
    }

    // Send holdings to Flask and get AI analysis back
    async function analyzePortfolio() {

        // Filter out incomplete rows
        const valid = holdings.filter(
            h => h.ticker && h.shares && h.buyPrice
        );

        if (valid.length === 0) {
            setAnalysis("Please enter at least one valid holding.");
            return;
        }

        setLoading(true);
        setAnalysis("");

        try {
            const res = await fetch("https://portfolio-ai-e1lf.onrender.com/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    holdings: valid.map(h => ({
                        ticker:   h.ticker.trim().toUpperCase(),
                        shares:   parseFloat(h.shares),
                        buyPrice: parseFloat(h.buyPrice)
                    }))
                })
            });

            const data = await res.json();

            if (data.error) {
                setAnalysis("Error: " + data.error);
            } else {
                setAnalysis(data.analysis);
            }

        } catch (err) {
            setAnalysis("Failed to connect to the server.");
        }

        setLoading(false);
    }

    return (
        <div>
            <h1>Portfolio AI Analyzer</h1>
            <h2>Enter your holdings below:</h2>

            {/* Holding rows */}
            {holdings.map((holding, index) => (
                <div className="holding" key={index}>
                    <input
                        type="text"
                        placeholder="Ticker (e.g. AAPL)"
                        value={holding.ticker}
                        onChange={e => updateHolding(index, "ticker", e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Shares"
                        value={holding.shares}
                        onChange={e => updateHolding(index, "shares", e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Buy Price"
                        value={holding.buyPrice}
                        onChange={e => updateHolding(index, "buyPrice", e.target.value)}
                    />
                    {/* Only show remove button if more than one row */}
                    {holdings.length > 1 && (
                        <button className="remove-btn" onClick={() => removeHolding(index)}>
                            ✕
                        </button>
                    )}
                </div>
            ))}

            <button onClick={addHolding}>Add Another Holding</button>
            <button onClick={analyzePortfolio} disabled={loading}>
                {loading ? "Analyzing... ⏳" : "Analyze Portfolio"}
            </button>

            {/* AI Analysis result */}
            {analysis && (
                <div id="results">
                    <h3>AI Analysis</h3>
                    <p id="analysis-text">{analysis}</p>
                </div>
            )}
        </div>
    );
}

export default Portfolio;