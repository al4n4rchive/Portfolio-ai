import { useState } from "react";
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

// Register the Chart.js components we need
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const PERIODS = [
    { label: "1W", value: "1wk" },
    { label: "1M", value: "1mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y"  },
    { label: "5Y", value: "5y"  }
];

function StockLookup() {
    const [ticker, setTicker]         = useState("");
    const [period, setPeriod]         = useState("1mo");
    const [stockData, setStockData]   = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");

    async function searchStock() {
        const symbol = ticker.trim().toUpperCase();

        if (!symbol) return;

        setLoading(true);
        setError("");
        setStockData(null);

        try {
            const res = await fetch(
                `hhttps://portfolio-ai-e1lf.onrender.com/stock_lookup?ticker=${symbol}&period=${period}`
            );
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setStockData(data);
            }

        } catch (err) {
            setError("Failed to connect to the server.");
        }

        setLoading(false);
    }

    // Allow pressing Enter to search
    function handleKeyDown(e) {
        if (e.key === "Enter") searchStock();
    }

    // Build Chart.js data from the prices array
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
            <h1>Stock Data</h1>
            <h2>Search Stock Data:</h2>

            {/* Search input */}
            <input
                type="text"
                placeholder="Enter ticker (e.g. AAPL)"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            {/* Period buttons */}
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
                {loading ? "Loading... ⏳" : "Search"}
            </button>

            {/* Error message */}
            {error && <p style={{ color: "red", marginTop: "16px" }}>{error}</p>}

            {/* Stock info + graph */}
            {stockData && (
                <div>
                    <div id="stock-info">
                        <h3 id="stock-name">
                            {stockData.name} ({stockData.ticker})
                        </h3>
                        <div id="stock-meta">
                            <span className="meta-price">${stockData.price}</span>
                            <span className="meta-stat">Period High: ${stockData.high}</span>
                            <span className="meta-stat">Period Low: ${stockData.low}</span>
                        </div>
                    </div>

                    <div id="chart-container">
                        <Line
                            data={buildChartData(stockData.prices)}
                            options={chartOptions}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default StockLookup;