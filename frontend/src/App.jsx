import { useState, useEffect } from "react";
import Portfolio from "./components/Portfolio";
import StockLookup from "./components/StockLookup";
import About from "./components/About";

const translations = {
    en: {
        title: "AIvestor 📈",
        subtitle: "Click to select an option:",
        portfolio: "📊 Portfolio AI Analyzer",
        lookup: "🔍 Current Stock Market Data",
        about: "ℹ️ About",
        coffee: "☕ Buy me a coffee",
        back: "← Back to Home",
        langBtn: "🌐 Español",
        darkBtn: "🌙 Dark",
        lightBtn: "☀️ Light",
    },
    es: {
        title: "AIvestor 📈",
        subtitle: "Haz clic para seleccionar una opción:",
        portfolio: "📊 Analizador de Portafolio AI",
        lookup: "🔍 Datos del Mercado de Valores",
        about: "ℹ️ Acerca del cito",
        coffee: "☕ Invítame un café",
        back: "← Volver al Inicio",
        langBtn: "🌐 English",
        darkBtn: "🌙 Oscuro",
        lightBtn: "☀️ Claro",
    }
};

function App() {
    const [page, setPage] = useState("home");
    const [lang, setLang] = useState("en");
    const [dark, setDark] = useState(false);

    const t = translations[lang];

    function toggleLang() {
        setLang(lang === "en" ? "es" : "en");
    }

    function toggleDark() {
        setDark(d => !d);
    }

    useEffect(() => {
        document.body.classList.toggle("dark", dark);
    }, [dark]);

    return (
        <div className="container">

            {/* Top bar */}
            <div className="top-bar">
                <button className="top-bar-btn" onClick={toggleDark}>
                    {dark ? t.lightBtn : t.darkBtn}
                </button>
                <button className="top-bar-btn" onClick={toggleLang}>
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
                    <button onClick={() => setPage("about")}
                        style={{ backgroundColor: "#7f8c8d" }}>
                        {t.about}
                    </button>

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

            {/* ABOUT PAGE */}
            {page === "about" && (
                <div>
                    <button className="back-btn" onClick={() => setPage("home")}>
                        {t.back}
                    </button>
                    <About lang={lang} />
                </div>
            )}

        </div>
    );
}

export default App;