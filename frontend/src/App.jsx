import { useState } from "react";
import Portfolio from "./components/Portfolio";
import StockLookup from "./components/StockLookup";

const translations = {
    en: {
        title: "Portfolio AI 📈",
        subtitle: "Click to select an option:",
        portfolio: "📊 Portfolio AI Analyzer",
        lookup: "🔍 Current Stock Market Data",
        coffee: "☕ Buy me a coffee",
        back: "← Back to Home",
        langBtn: "🌐 Español",
    },
    es: {
        title: "Portfolio AI 📈",
        subtitle: "Haz clic para seleccionar una opción:",
        portfolio: "📊 Analizador de Portafolio AI",
        lookup: "🔍 Datos del Mercado de Valores",
        coffee: "☕ Invítame un café",
        back: "← Volver al Inicio",
        langBtn: "🌐 English",
    }
};

function App() {
    const [page, setPage] = useState("home");
    const [lang, setLang] = useState("en");

    const t = translations[lang];

    function toggleLang() {
        setLang(lang === "en" ? "es" : "en");
    }

    return (
        <div className="container">

            {/* Language Toggle */}
            <div style={{ textAlign: "right" }}>
                <button
                    onClick={toggleLang}
                    style={{
                        background: "none",
                        color: "#3498db",
                        padding: "4px 10px",
                        fontWeight: "normal",
                        fontSize: "0.9rem",
                        border: "1px solid #3498db",
                        borderRadius: "4px",
                        marginBottom: "10px"
                    }}
                >
                    {t.langBtn}
                </button>
            </div>

            {/* HOME PAGE */}
            {page === "home" && (
                <div>
                    <h1>{t.title}</h1>
                    <h2>{t.subtitle}</h2>

                    <button onClick={() => setPage("portfolio")}>
                        {t.portfolio}
                    </button>
                    <button onClick={() => setPage("stocklookup")}>
                        {t.lookup}
                    </button>

                    {/* Buy Me a Coffee */}
                    <div className="coffee-wrapper">
                        <a
                            href="https://buymeacoffee.com/alanmartinez"
                            target="_blank"
                            rel="noreferrer"
                            className="coffee-btn"
                        >
                            {t.coffee}
                        </a>
                    </div>
                </div>
            )}

            {/* PORTFOLIO PAGE */}
            {page === "portfolio" && (
                <div>
                    <button className="back-btn" onClick={() => setPage("home")}>
                        {t.back}
                    </button>
                    <Portfolio lang={lang} />
                </div>
            )}

            {/* STOCK LOOKUP PAGE */}
            {page === "stocklookup" && (
                <div>
                    <button className="back-btn" onClick={() => setPage("home")}>
                        {t.back}
                    </button>
                    <StockLookup lang={lang} />
                </div>
            )}

        </div>
    );
}

export default App;