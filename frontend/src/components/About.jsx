const translations = {
    en: {
        title: "About AIvestor",
        whatTitle: "What is AIvestor?",
        whatText: "AIvestor is a free AI-powered tool that helps you analyze your stock portfolio, look up real-time market data, and get beginner-friendly investment insights powered by Groq AI (LLaMA 3.3 70B). Built after my parents wanted to start investing but didn't know where to begin — I wanted to create a beginner-friendly guide for anyone new to stocks.",
        featuresTitle: "Features",
        features: [
            "📊 Portfolio AI Analyzer — Enter your holdings and get AI buy/hold/sell recommendations",
            "📈 Performance Metrics — Total value, gain/loss, return %, and S&P 500 comparison",
            "🎯 Risk Analysis — Sector exposure, diversification score, and optimization tips",
            "🔍 Stock Lookup — Search any ticker and view price history with interactive charts",
            "🤖 AI Price Prediction — Get a short-term market outlook based on historical data",
            "💬 Follow-up Chat — Ask questions about your portfolio or stock after analysis",
            "⭐ Watchlist — Save your favorite tickers for quick access",
            "📋 Portfolio History — View and continue past analyses",
            "🌐 English & Spanish support",
        ],
        disclaimerTitle: "⚠️ Disclaimer",
        disclaimerText: "AIvestor is for educational purposes only. Nothing here is financial advice. Always do your own research before making investment decisions.",
        builtTitle: "Built With",
        builtText: "React + Vite (frontend) • Python Flask (backend) • yFinance (market data) • Groq API / LLaMA 3.3 70B (AI) • Deployed on Vercel + Render",
        authorTitle: "Author",
        authorText: "Built by Alan Martinez",
    },
    es: {
        title: "Acerca de AIvestor",
        whatTitle: "¿Qué es AIvestor?",
        whatText: "AIvestor es una herramienta gratuita impulsada por IA que te ayuda a analizar tu portafolio de acciones, consultar datos del mercado en tiempo real y obtener información de inversión para principiantes. Construida después de que mis padres quisieran comenzar a invertir pero no supieran por dónde empezar.",
        featuresTitle: "Características",
        features: [
            "📊 Analizador de Portafolio AI — Ingresa tus inversiones y obtén recomendaciones",
            "📈 Métricas de Rendimiento — Valor total, ganancias/pérdidas, retorno y comparación con S&P 500",
            "🎯 Análisis de Riesgo — Exposición sectorial y puntuación de diversificación",
            "🔍 Búsqueda de Acciones — Busca cualquier ticker y ve el historial de precios",
            "🤖 Predicción AI — Perspectiva del mercado a corto plazo",
            "💬 Chat de Seguimiento — Haz preguntas sobre tu portafolio",
            "⭐ Lista de Seguimiento — Guarda tus tickers favoritos",
            "📋 Historial — Ve y continúa análisis anteriores",
            "🌐 Soporte en inglés y español",
        ],
        disclaimerTitle: "⚠️ Descargo de Responsabilidad",
        disclaimerText: "AIvestor es solo con fines educativos. Nada aquí es asesoramiento financiero. Siempre haz tu propia investigación antes de tomar decisiones de inversión.",
        builtTitle: "Construido Con",
        builtText: "React + Vite (frontend) • Python Flask (backend) • yFinance (datos de mercado) • Groq API / LLaMA 3.3 70B (IA) • Desplegado en Vercel + Render",
        authorTitle: "Autor",
        authorText: "Construido por Alan Martinez",
    }
};

function About({ lang }) {
    const t = translations[lang] || translations.en;

    return (
        <div>
            <h1>{t.title}</h1>

            {/* What is AIvestor */}
            <div className="about-card">
                <h3>{t.whatTitle}</h3>
                <p>{t.whatText}</p>
            </div>

            {/* Features */}
            <div className="about-card">
                <h3>{t.featuresTitle}</h3>
                <ul className="about-list">
                    {t.features.map((f, i) => (
                        <li key={i}>{f}</li>
                    ))}
                </ul>
            </div>

            {/* Disclaimer */}
            <div className="about-card about-disclaimer">
                <h3>{t.disclaimerTitle}</h3>
                <p>{t.disclaimerText}</p>
            </div>

            {/* Built With */}
            <div className="about-card">
                <h3>{t.builtTitle}</h3>
                <p>{t.builtText}</p>
            </div>

            {/* Author */}
            <div className="about-card">
                <h3>{t.authorTitle}</h3>
                <p>{t.authorText}</p>
                <div className="about-links">
                    <a href="https://github.com/al4n4rchive" target="_blank" rel="noreferrer" className="about-link github">
                        GitHub
                    </a>
                    <a href="https://www.linkedin.com/in/alanmartinez08" target="_blank" rel="noreferrer" className="about-link">
                        LinkedIn
                    </a>
                    <a href="https://buymeacoffee.com/alanmartinez" target="_blank" rel="noreferrer" className="coffee-btn">
                        ☕ Buy me a coffee
                    </a>
                </div>
            </div>
        </div>
    );
}

export default About;