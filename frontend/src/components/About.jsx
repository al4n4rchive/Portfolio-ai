const translations = {
    en: {
        title: "About AIvestor",
        whatTitle: "What is AIvestor?",
        whatText: "AIvestor is a free AI-powered tool that helps you analyze your stock portfolio, look up real-time market data, and get beginner-friendly investment insights powered by Groq AI (LLaMA 3.3 70B).",
        featuresTitle: "Features",
        features: [
            "📊 Portfolio AI Analyzer — Enter your holdings and get AI buy/hold/sell recommendations",
            "🔍 Stock Lookup — Search any ticker and view price history with interactive charts",
            "🔮 AI Price Prediction — Get a short-term market outlook based on historical data",
            "💬 Follow-up Chat — Ask questions about your portfolio after analysis",
            "🌐 English & Spanish support",
        ],
        disclaimerTitle: "⚠️ Disclaimer",
        disclaimerText: "AIvestor is for educational purposes only. Nothing here is financial advice. Always do your own research before making investment decisions.",
        techTitle: "Built With",
        techText: "React + Vite (frontend) • Python Flask (backend) • yFinance (market data) • Groq API / LLaMA 3.3 70B (AI) • Deployed on Vercel + Render",
        authorTitle: "Author",
        authorText: "Built by Alan Martinez",
    },
    es: {
        title: "Acerca de AIvestor",
        whatTitle: "¿Qué es AIvestor?",
        whatText: "AIvestor es una herramienta gratuita impulsada por IA que te ayuda a analizar tu portafolio de acciones, consultar datos del mercado en tiempo real y obtener consejos de inversión para principiantes usando Groq AI (LLaMA 3.3 70B).",
        featuresTitle: "Funciones",
        features: [
            "📊 Analizador de Portafolio — Ingresa tus inversiones y obtén recomendaciones de compra/mantener/vender",
            "🔍 Búsqueda de Acciones — Busca cualquier ticker y ve el historial de precios con gráficos",
            "🔮 Predicción de Precios AI — Obtén una perspectiva a corto plazo basada en datos históricos",
            "💬 Chat de Seguimiento — Haz preguntas sobre tu portafolio después del análisis",
            "🌐 Soporte en inglés y español",
        ],
        disclaimerTitle: "⚠️ Aviso",
        disclaimerText: "AIvestor es solo para fines educativos. Nada aquí es asesoramiento financiero. Siempre haz tu propia investigación antes de tomar decisiones de inversión.",
        techTitle: "Tecnologías",
        techText: "React + Vite (frontend) • Python Flask (backend) • yFinance (datos de mercado) • Groq API / LLaMA 3.3 70B (IA) • Desplegado en Vercel + Render",
        authorTitle: "Autor",
        authorText: "Creado por Alan Martinez",
    }
};

function About({ lang }) {
    const t = translations[lang] || translations.en;

    return (
        <div>
            <h1>{t.title}</h1>

            <div className="about-section">
                <h3>{t.whatTitle}</h3>
                <p>{t.whatText}</p>
            </div>

            <div className="about-section">
                <h3>{t.featuresTitle}</h3>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {t.features.map((f, i) => (
                        <li key={i} style={{ marginBottom: "8px", color: "var(--text)", fontSize: "0.95rem" }}>
                            {f}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="about-section" style={{ borderLeftColor: "#e74c3c" }}>
                <h3 style={{ color: "#e74c3c" }}>{t.disclaimerTitle}</h3>
                <p>{t.disclaimerText}</p>
            </div>

            <div className="about-section">
                <h3>{t.techTitle}</h3>
                <p>{t.techText}</p>
            </div>

            <div className="about-section">
                <h3>{t.authorTitle}</h3>
                <p>{t.authorText}</p>
                <div className="about-links">
                    <a href="https://github.com/al4n4rchive" target="_blank" rel="noreferrer">GitHub</a>
                    <a href="https://www.linkedin.com/in/alanmartinez08/" target="_blank" rel="noreferrer">LinkedIn</a>
                    <a href="https://buymeacoffee.com/alanmartinez" target="_blank" rel="noreferrer">☕ Buy me a coffee</a>
                </div>
            </div>
        </div>
    );
}

export default About;