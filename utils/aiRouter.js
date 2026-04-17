import callFallback from "./fallback.js";

import groq from "../services/groq.js";
import { searchWeb } from "../services/search.js";
import { getWiki } from "../services/wiki.js";
import { getNews } from "../services/news.js";

// 🧠 MEMORY STORE
const userMemory = {};
const userGoals = {};

// =======================
// 🧠 AI ROUTER CORE (PRO MAX)
// =======================
export default async function aiRouter({ msg, userId }) {
  try {
    if (!msg) return "⚠️ Empty message";

    // INIT
    if (!userMemory[userId]) userMemory[userId] = [];
    if (!userGoals[userId]) userGoals[userId] = null;

    userMemory[userId].push({ role: "user", content: msg });

    // memory limit
    if (userMemory[userId].length > 20) {
      userMemory[userId].shift();
    }

    const history = userMemory[userId].slice(-10);
    const text = msg.toLowerCase();

    // 🎯 goal tracking
    if (text.includes("goal")) {
      userGoals[userId] = msg;
    }

    // =======================
    // 🧠 AUTO SMART MODE (FIXED)
    // =======================

    let mode = "chat";

    if (
      text.includes("what is") ||
      text.includes("who is") ||
      text.includes("define") ||
      text.includes("explain")
    ) {
      mode = "wiki";
    } 
    else if (
      text.includes("news") ||
      text.includes("latest") ||
      text.includes("today") ||
      text.includes("breaking")
    ) {
      mode = "news";
    } 
    else if (
      text.includes("search") ||
      text.includes("google") ||
      text.includes("find")
    ) {
      mode = "search";
    }

    // =======================
    // ⚡ DATA FETCH (OPTIMIZED)
    // =======================

    let wikiData = null;
    let newsData = "";
    let searchData = "";

    if (mode === "wiki") {
      wikiData = await getWiki(msg);
    }

    if (mode === "news") {
      const data = await getNews(msg);
      newsData = data
        ? data.map(n => `${n.title} - ${n.description}`).join("\n")
        : "";
    }

    if (mode === "search") {
      const data = await searchWeb(msg);
      searchData = data
        ? data.map(r => `${r.title} - ${r.snippet}`).join("\n")
        : "";
    }

    // =======================
    // 🧠 PROMPT ENGINE
    // =======================

    const prompt = `
You are Far Western AI — smart SaaS assistant.

User Goal:
${userGoals[userId] || "none"}

Mode:
${mode}

Wiki Data:
${wikiData || "none"}

News Data:
${newsData || "none"}

Search Data:
${searchData || "none"}

Chat History:
${history.map(m => `${m.role}: ${m.content}`).join("\n")}

RULES:
- Be accurate and helpful
- Use provided data when available
- Never say you don't know if data exists
- Combine sources if needed
`;

    // =======================
    // 🤖 AI CHAIN
    // =======================

    let reply = await groq(prompt);

    // fallback trigger
    if (!reply || reply.length < 20) {
      reply = await callFallback(prompt);
    }

    if (!reply) {
      reply = "⚠️ AI system unavailable";
    }

    // save memory
    userMemory[userId].push({ role: "bot", content: reply });

    return reply;

  } catch (err) {
    console.error("AI ROUTER ERROR:", err);
    return "⚠️ Router crash error";
  }
}