import { useState } from "react";
import Portfolio from "./components/Portfolio";
import StockLookup from "./components/StockLookup";

function App() {
    const [page, setPage] = useState("home");

    return (
        <div className="container">

            {/* HOME PAGE */}
            {page === "home" && (
                <div>
                    <h1>Portfolio AI 📈</h1>
                    <h2>Click to select an option:</h2>

                    <button onClick={() => setPage("portfolio")}>
                        📊 Portfolio AI Analyzer
                    </button>
                    <button onClick={() => setPage("stocklookup")}>
                        🔍 Current Stock Market Data
                    </button>

                    {/* Buy Me a Coffee */}
                    <div className="coffee-wrapper">
                        <a
                            href="https://buymeacoffee.com/alanmartinez"
                            target="_blank"
                            rel="noreferrer"
                            className="coffee-btn"
                        >
                            ☕ Buy me a coffee
                        </a>
                    </div>
                </div>
            )}

            {/* PORTFOLIO PAGE */}
            {page === "portfolio" && (
                <div>
                    <button className="back-btn" onClick={() => setPage("home")}>
                        ← Back to Home
                    </button>
                    <Portfolio />
                </div>
            )}

            {/* STOCK LOOKUP PAGE */}
            {page === "stocklookup" && (
                <div>
                    <button className="back-btn" onClick={() => setPage("home")}>
                        ← Back to Home
                    </button>
                    <StockLookup />
                </div>
            )}

        </div>
    );
}

export default App;