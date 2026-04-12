require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// MEMORY
// =====================
let memory = [];

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 10) memory.shift();
}

function getContext() {
  return memory.map(m => `User:${m.u}\nAI:${m.b}`).join("\n");
}

// =====================
// MULTI KEYS
// =====================
const split = (k) =>
  process.env[k]?.split(",").map(x => x.trim()).filter(Boolean) || [];

// =====================
// 🔥 REALTIME DATA (GOOGLE + NEWS)
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
  } catch { return ""; }
}

async function news(q) {
  try {
    if (!process.env.NEWSDATA_KEY) return "";

    const r = await fetch(`https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_KEY}&q=${q}`);
    const d = await r.json();

    return d?.results?.map(x => x.title).join("\n") || "";
  } catch { return ""; }
}

// =====================
// 🤖 AI PROVIDERS
// =====================

// GROQ
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
          messages: [{ role: "user", content: prompt }]
        })
      });
      const d = await r.json();
      if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
    } catch {}
  }
}

// GEMINI
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

// OPENROUTER
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
          messages: [{ role: "user", content: prompt }]
        })
      });

      const d = await r.json();
      if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
    } catch {}
  }
}

// TOGETHER AI
async function together(prompt) {
  try {
    if (!process.env.TOGETHER_KEY) return;

    const r = await fetch("https://api.together.xyz/v1/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        prompt: prompt,
        max_tokens: 300
      })
    });

    const d = await r.json();
    return d?.choices?.[0]?.text;
  } catch {}
}

// COHERE
async function cohere(prompt) {
  try {
    if (!process.env.COHERE_KEY) return;

    const r = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 200
      })
    });

    const d = await r.json();
    return d?.generations?.[0]?.text;
  } catch {}
}

// =====================
// 🧠 MASTER AI (NEVER FAIL)
// =====================
async function AI(prompt) {

  const ctx = getContext();

  const [g, n] = await Promise.all([
    google(prompt),
    news(prompt)
  ]);

  const finalPrompt = `
You are a powerful real-time AI.

Rules:
- Always correct
- No repetition
- Human tone
- Use latest info

Conversation:
${ctx}

User: ${prompt}

Google:
${g}

News:
${n}
`;

  const results = await Promise.allSettled([
    groq(finalPrompt),
    gemini(finalPrompt),
    openrouter(finalPrompt),
    together(finalPrompt),
    cohere(finalPrompt)
  ]);

  const outputs = results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value)
    .filter(Boolean);

  const best = outputs.sort((a,b)=>b.length-a.length)[0];

  return best?.replace(/\n+/g, " ").trim() || "⚠️ AI failed, try again";
}

// =====================
// CHAT
// =====================
app.post("/chat", async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg) return res.json({ reply: "Say something" });

    const reply = await AI(msg);

    addMemory(msg, reply);

    res.json({ reply });

  } catch (e) {
    console.log(e);
    res.json({ reply: "Server error" });
  }
});

app.listen(PORT, () =>
  console.log("🔥 SUPER AI RUNNING ON PORT " + PORT)
);