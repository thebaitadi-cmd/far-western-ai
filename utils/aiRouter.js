import callFallback from "./fallback.js";

import { callGroq } from "../services/groq.js";
import { searchWeb } from "../services/search.js";
import { getWiki } from "../services/wiki.js";
import { getNews } from "../services/news.js";

// 🧠 MEMORY STORE
const userMemory = {};
const userGoals = {};

// =======================
// 🧠 AI ROUTER CORE
// =======================
export default async function aiRouter({ msg, userId }) {
  try {
    if (!msg) return "⚠️ Empty message";

    // INIT USER MEMORY
    if (!userMemory[userId]) userMemory[userId] = [];
    if (!userGoals[userId]) userGoals[userId] = null;

    userMemory[userId].push({ role: "user", content: msg });

    // 🧠 MEMORY LIMIT (IMPORTANT FIX)
    if (userMemory[userId].length > 20) {
      userMemory[userId].shift();
    }

    const history = userMemory[userId].slice(-10);
    const text = msg.toLowerCase();

    // 🎯 GOAL TRACK
    if (text.includes("goal")) {
      userGoals[userId] = msg;
    }

    // =======================
    // 🌐 INTENT DETECTION (PRO MAX)
    // =======================

    const isWiki =
      text.includes("what is") ||
      text.includes("who is") ||
      text.includes("define") ||
      text.includes("explain");

    const isNews =
      text.includes("news") ||
      text.includes("latest") ||
      text.includes("today") ||
      text.includes("breaking");

    const isSearch =
      text.includes("google") ||
      text.includes("search") ||
      text.includes("find");

    // =======================
    // ⚡ PARALLEL DATA FETCH
    // =======================

    const [wikiRaw, newsRaw, searchRaw] = await Promise.all([
      isWiki ? getWiki(msg) : null,
      isNews ? getNews(msg) : null,
      isSearch ? searchWeb(msg) : null
    ]);

    // =======================
    // 🧾 NORMALIZATION
    // =======================

    const wikiData = wikiRaw || null;

    const newsData = newsRaw
      ? newsRaw.map(n => `${n.title} - ${n.description}`).join("\n")
      : "";

    const searchData = searchRaw
      ? searchRaw.map(r => `${r.title} - ${r.snippet}`).join("\n")
      : "";

    // =======================
    // 🧠 PROMPT ENGINE
    // =======================

    const prompt = `
You are Far Western AI — a powerful SaaS AI assistant.

User Goal:
${userGoals[userId] || "none"}

Mode:
${isWiki ? "wiki" : isNews ? "news" : isSearch ? "search" : "chat"}

Wiki Data:
${wikiData || "none"}

News Data:
${newsData || "none"}

Search Data:
${searchData || "none"}

Chat History:
${history.map(m => `${m.role}: ${m.content}`).join("\n")}

Rules:
- Be clear, accurate and helpful
- Combine multiple sources if available
- Prioritize latest and factual info
- If unsure, say so
    `;

    // =======================
    // 🤖 AI CHAIN (GROQ → FALLBACK)
    // =======================

    let reply = await callGroq(prompt);

    // ⚠️ SMART FALLBACK TRIGGER
    if (
      !reply ||
      reply.includes("I don't know") ||
      reply.length < 20
    ) {
      reply = await callFallback(prompt);
    }

    if (!reply) {
      reply = "⚠️ AI system unavailable";
    }

    // 💾 SAVE MEMORY
    userMemory[userId].push({ role: "bot", content: reply });

    return reply;

  } catch (err) {
    console.error("AI ROUTER ERROR:", err);
    return "⚠️ Router crash error";
  }
}