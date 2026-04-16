import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fetch from "node-fetch";

const app = express();

// ✅ SMART CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 🧠 USER MEMORY (IN-MEMORY)
const userMemory = {};

// 🎯 USER GOALS
const userGoals = {};

// =======================
// 🤖 GEMINI
// =======================
async function callGemini(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch {
    return null;
  }
}

// =======================
// ⚡ GROQ (FAST)
// =======================
async function callGroq(prompt) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_KEYS}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;

  } catch {
    return null;
  }
}

// =======================
// 🌐 SERPER (SEARCH)
// =======================
async function searchWeb(query) {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query })
    });

    const data = await res.json();
    return data.organic?.slice(0, 3) || [];

  } catch {
    return [];
  }
}

// =======================
// 🧠 CHAT API
// =======================
app.post("/chat", async (req, res) => {
  const { msg } = req.body;
  const userId = req.headers["x-user-id"] || "default";

  if (!msg) {
    return res.json({ reply: "⚠️ Empty message" });
  }

  try {
    // 👉 INIT MEMORY
    if (!userMemory[userId]) userMemory[userId] = [];
    if (!userGoals[userId]) userGoals[userId] = null;

    // 👉 SAVE USER MESSAGE
    userMemory[userId].push({ role: "user", content: msg });

    // 👉 LIMIT MEMORY
    const history = userMemory[userId].slice(-10);

    // =======================
    // 🎯 GOAL DETECTION
    // =======================
    if (msg.toLowerCase().includes("goal")) {
      userGoals[userId] = msg;
    }

    // =======================
    // 🌐 SEARCH TRIGGER
    // =======================
    let searchData = "";
    if (
      msg.toLowerCase().includes("news") ||
      msg.toLowerCase().includes("latest") ||
      msg.toLowerCase().includes("today")
    ) {
      const results = await searchWeb(msg);
      searchData = results.map(r => `${r.title} - ${r.snippet}`).join("\n");
    }

    // =======================
    // 🧠 FINAL PROMPT
    // =======================
    const prompt = `
You are Far Western AI — powerful, smart, slightly bold assistant.

User Goal: ${userGoals[userId] || "none"}

Web Data:
${searchData || "none"}

Conversation:
${history.map(m => `${m.role}: ${m.content}`).join("\n")}

Instructions:
- Give practical answer
- Help user achieve goals
- Be clear and useful
`;

    // =======================
    // 🤖 MULTI AI
    // =======================
    let reply = await callGemini(prompt);

    if (!reply) {
      reply = await callGroq(prompt);
    }

    if (!reply) {
      reply = "⚠️ AI not responding";
    }

    // 👉 SAVE BOT REPLY
    userMemory[userId].push({ role: "bot", content: reply });

    res.json({ reply });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ reply: "⚠️ Server error" });
  }
});

// =======================
// ✅ HEALTH
// =======================
app.get("/health", (req, res) => {
  res.send("OK");
});

// =======================
// ✅ ROOT
// =======================
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// =======================
// 🚀 PORT
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 AI RUNNING ON PORT " + PORT);
});