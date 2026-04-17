const groq = require("../services/groq");

// (next services banenge tab enable karenge)
let gemini = null;
let together = null;
let openrouter = null;

try {
    gemini = require("../services/gemini");
} catch (e) {}

try {
    together = require("../services/together");
} catch (e) {}

try {
    openrouter = require("../services/openrouter");
} catch (e) {}

async function fallback(message) {
    // 🧠 LAYER 1 — GROQ (PRIMARY)
    try {
        const res = await groq(message);
        if (res) return res;
    } catch (e) {
        console.log("Groq failed");
    }

    // 🧠 LAYER 2 — GEMINI
    if (gemini) {
        try {
            const res = await gemini(message);
            if (res) return res;
        } catch (e) {
            console.log("Gemini failed");
        }
    }

    // 🧠 LAYER 3 — TOGETHER AI
    if (together) {
        try {
            const res = await together(message);
            if (res) return res;
        } catch (e) {
            console.log("Together failed");
        }
    }

    // 🧠 LAYER 4 — OPENROUTER
    if (openrouter) {
        try {
            const res = await openrouter(message);
            if (res) return res;
        } catch (e) {
            console.log("OpenRouter failed");
        }
    }

    // ❌ FINAL FALLBACK
    return "⚠️ All AI systems are busy right now. Please try again later.";
}

module.exports = fallback;