require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// 🧠 MEMORY
// =====================
let memory = [];

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 6) memory.shift();
}

function getContext() {
  return memory.map(m => `User:${m.u}\nAI:${m.b}`).join("\n");
}

// =====================
// 🔑 HELPERS
// =====================
const split = (k) =>
  process.env[k]?.split(",").map(x => x.trim()).filter(Boolean) || [];

// =====================
// ✂️ CLEAN RESPONSE
// =====================
function clean(text) {
  if (!text) return "";

  return text
    .replace(/\n+/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/(1\.|2\.|3\.|4\.|5\.)/g, "")
    .replace(/AI:/gi, "")
    .trim()
    .slice(0, 140);
}

// =====================
// 🌐 GOOGLE (REALTIME)
// =====================
async function google(q) {
  try {
    if (!process.env.SERPER_KEY) return "";

    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q })
    });

    const d = await r.json();
    return d?.organic?.map(x => x.snippet).join("\n") || "";
  } catch {
    return "";
  }
}

// =====================
// 🤖 AI PROVIDERS
// =====================
async function groq(prompt) {
  for (let key of split("GROQ_KEYS")) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a smart assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.5
        })
      });

      const d = await r.json();
      if (d?.choices?.[0]?.message?.content) {
        return d.choices[0].message.content;
      }
    } catch {}
  }
}

async function openrouter(prompt) {
  for (let key of split("OPENROUTER_KEYS")) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5
        })
      });

      const d = await r.json();
      if (d?.choices?.[0]?.message?.content) {
        return d.choices[0].message.content;
      }
    } catch {}
  }
}

async function gemini(prompt) {
  try {
    if (!process.env.GEMINI_KEY) return;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const d = await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {}
}

async function cohere(prompt) {
  try {
    if (!process.env.COHERE_KEY) return;

    const r = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r",
        message: prompt,
        temperature: 0.5
      })
    });

    const d = await r.json();
    return d.text;
  } catch {}
}

// =====================
// 🧠 MAIN AI (FINAL BRAIN)
// =====================
async function AI(prompt) {

  const p = prompt.toLowerCase();
  let mode = "chat";

  if (p.includes("summarize") || p.includes("summary")) mode = "summary";
  else if (p.includes("latest") || p.includes("today") || p.includes("news")) mode = "realtime";

  const ctx = getContext();

  // 🧠 THINKING
  let intent = "";
  try {
    intent = await groq(`
Understand user intent in ONE SHORT LINE.

User: "${prompt}"

Examples:
- greeting
- asking question
- asking help
- unclear

Answer only intent.
`);
  } catch {}

  // 🔥 SUMMARY
  if (mode === "summary") {
    prompt = `Summarize in 1 line:\n${ctx}`;
  }

  // 🌐 REALTIME
  let extra = "";
  if (mode === "realtime") {
    const g = await google(prompt);
    if (g) extra = "\nLatest:\n" + g;
  }

  // 🎯 FINAL PROMPT
  const fullPrompt = `
You are a HIGH QUALITY AI.

STRICT RULES:
- Understand intent BEFORE replying
- Reply ONLY relevant
- VERY SHORT (1 line)
- SAME language
- Natural human tone
- NO guessing
- If unclear → ask short question

Conversation:
${ctx}

Intent:
${intent}

User: ${prompt}
${extra}
`;

  let r;

  r = await groq(fullPrompt);
  if (r) return clean(r);

  r = await openrouter(fullPrompt);
  if (r) return clean(r);

  r = await gemini(fullPrompt);
  if (r) return clean(r);

  r = await cohere(fullPrompt);
  if (r) return clean(r);

  return "Try again";
}

// =====================
// 🚀 ROUTE
// =====================
app.post("/chat", async (req, res) => {
  try {
    const msg = req.body.message;

    if (!msg) return res.json({ reply: "Say something" });

    const reply = await AI(msg);

    addMemory(msg, reply);

    res.json({ reply });

  } catch (e) {
    console.log("ERROR:", e);
    res.json({ reply: "Server error" });
  }
});

// =====================
app.listen(PORT, () => console.log("🔥 FINAL AI RUNNING ON " + PORT));