import { useState, useEffect } from "react";
import Portfolio from "./components/Portfolio";
import StockLookup from "./components/StockLookup";
import About from "./components/About";

const translations = {
    en: {
        title: "AIvestor 📈",
        subtitle: "Click to select an option:",
        portfolio: "📊 Portfolio Analyzer",
        lookup: "🔍 Stock Lookup",
        about: "ℹ️ About",
        coffee: "☕ Buy me a coffee",
        langBtn: "🌐 Español",
        darkBtn: "🌙 Dark",
        lightBtn: "☀️ Light",
        home: "🏠 Home",
    },
    es: {
        title: "AIvestor 📈",
        subtitle: "Haz clic para seleccionar una opción:",
        portfolio: "📊 Analizador de Portafolio",
        lookup: "🔍 Buscar Acciones",
        about: "ℹ️ Acerca de",
        coffee: "☕ Invítame un café",
        langBtn: "🌐 English",
        darkBtn: "🌙 Oscuro",
        lightBtn: "☀️ Claro",
        home: "🏠 Inicio",
    }
};

function App() {
    const [page, setPage] = useState("home");
    const [lang, setLang] = useState("en");
    const [dark, setDark] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const t = translations[lang];

    function toggleLang() { setLang(lang === "en" ? "es" : "en"); }
    function toggleDark()  { setDark(d => !d); }

    useEffect(() => {
        document.body.classList.toggle("dark", dark);
    }, [dark]);

    // Auto-navigate to portfolio page if share link detected
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("s")) {
            setPage("portfolio");
        }
    }, []);

    function navigate(p) {
        setPage(p);
        setSidebarOpen(false);
    }

    const navItems = [
        { key: "home",        label: t.home },
        { key: "portfolio",   label: t.portfolio },
        { key: "stocklookup", label: t.lookup },
        { key: "about",       label: t.about },
    ];

    return (
        <div className="app-layout">

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-logo" onClick={() => navigate("home")}>
                    AIvestor 📈
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={`sidebar-btn ${page === item.key ? "sidebar-active" : ""}`}
                            onClick={() => navigate(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Buy Me a Coffee in sidebar */}
                <div className="sidebar-coffee">
                    <a
                        href="https://buymeacoffee.com/alanmartinez"
                        target="_blank"
                        rel="noreferrer"
                        className="coffee-btn"
                    >
                        {t.coffee}
                    </a>
                </div>
            </aside>

            {/* ── Overlay for mobile ── */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Main content ── */}
            <main className="main-content">

                {/* Top bar */}
                <div className="top-bar">
                    {/* Hamburger for mobile */}
                    <button
                        className="hamburger"
                        onClick={() => setSidebarOpen(o => !o)}
                    >
                        ☰
                    </button>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                        <button className="top-bar-btn" onClick={toggleDark}>
                            {dark ? t.lightBtn : t.darkBtn}
                        </button>
                        <button className="top-bar-btn" onClick={toggleLang}>
                            {t.langBtn}
                        </button>
                    </div>
                </div>

                {/* Pages */}
                <div className="page-content">
                    {page === "home" && (
                        <div>
                            <h1>{t.title}</h1>
                            <h2>{t.subtitle}</h2>
                            <div className="home-cards">
                                <div className="home-card" onClick={() => navigate("portfolio")}>
                                    <div className="home-card-icon">📊</div>
                                    <h3>Portfolio AI Analyzer</h3>
                                    <p>Enter your holdings and get AI-powered buy, hold, or sell recommendations with full performance metrics.</p>
                                </div>
                                <div className="home-card" onClick={() => navigate("stocklookup")}>
                                    <div className="home-card-icon">🔍</div>
                                    <h3>Stock Lookup</h3>
                                    <p>Search any stock ticker, view interactive price charts, get AI predictions and market news.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {page === "portfolio"   && <Portfolio lang={lang} />}
                    {page === "stocklookup" && <StockLookup lang={lang} />}
                    {page === "about"       && <About lang={lang} />}
                </div>
            </main>
        </div>
    );
}

export default App;