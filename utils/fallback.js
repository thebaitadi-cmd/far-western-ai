import groq from "../services/groq.js";

// optional services (safe load)
let gemini = null;
let together = null;
let openrouter = null;

try {
    gemini = (await import("../services/gemini.js")).default;
} catch {}

try {
    together = (await import("../services/together.js")).default;
} catch {}

try {
    openrouter = (await import("../services/openrouter.js")).default;
} catch {}

export default async function callFallback(message) {

    // 🧠 LAYER 1 — GROQ
    try {
        const res = await groq(message);
        if (res) return res;
    } catch {
        console.log("Groq failed");
    }

    // 🧠 LAYER 2 — GEMINI
    if (gemini) {
        try {
            const res = await gemini(message);
            if (res) return res;
        } catch {
            console.log("Gemini failed");
        }
    }

    // 🧠 LAYER 3 — TOGETHER
    if (together) {
        try {
            const res = await together(message);
            if (res) return res;
        } catch {
            console.log("Together failed");
        }
    }

    // 🧠 LAYER 4 — OPENROUTER
    if (openrouter) {
        try {
            const res = await openrouter(message);
            if (res) return res;
        } catch {
            console.log("OpenRouter failed");
        }
    }

    // ❌ FINAL
    return "⚠️ All AI systems are busy. Try again.";
}