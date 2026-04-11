require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// 🧠 MEMORY + USER STYLE
// =====================
let memory = [];
let userStyle = "normal";

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 8) memory.shift();
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
// ✂️ CLEAN
// =====================
function clean(text) {
  if (!text) return "";

  return text
    .replace(/\n+/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/AI:/gi, "")
    .trim()
    .slice(0, 200);
}

// =====================
// 🌐 REALTIME GOOGLE
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
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6
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
          temperature: 0.6
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
        message: prompt
      })
    });

    const d = await r.json();
    return d.text;
  } catch {}
}

// =====================
// 🧠 INTENT DETECTOR (BRAIN)
// =====================
async function detectIntent(prompt) {
  const result = await groq(`
Classify user intent:
- coding
- general
- realtime
- summary
- unclear

User: "${prompt}"

Answer only one word.
`);

  return result?.toLowerCase().trim();
}

// =====================
// 🧠 PARALLEL THINKING
// =====================
async function parallelThink(prompt) {
  const [g, o, gm] = await Promise.all([
    groq(prompt),
    openrouter(prompt),
    gemini(prompt)
  ]);

  return [g, o, gm].filter(Boolean);
}

// =====================
// 🧠 BEST ANSWER SELECTOR
// =====================
function selectBest(responses) {
  if (!responses.length) return null;

  // 🔥 simple scoring: longest + informative
  return responses.sort((a, b) => b.length - a.length)[0];
}

// =====================
// 🧠 MASTER AI
// =====================
async function AI(prompt) {

  const intent = await detectIntent(prompt);
  const ctx = getContext();

  let extra = "";

  if (intent === "realtime") {
    const g = await google(prompt);
    extra = g;
  }

  if (intent === "summary") {
    prompt = `Summarize in 1 line:\n${ctx}`;
  }

  // 🧠 build final prompt
  const finalPrompt = `
You are a HIGH LEVEL AI.

Rules:
- Understand deeply
- Reply in same language
- Short but powerful
- No guessing

Context:
${ctx}

User: ${prompt}

Extra:
${extra}
`;

  // 🚀 parallel thinking
  const responses = await parallelThink(finalPrompt);

  // 🎯 best answer
  let best = selectBest(responses);

  if (!best) {
    best = await cohere(finalPrompt);
  }

  return clean(best || "Try again");
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
    console.log(e);
    res.json({ reply: "Server error" });
  }
});

app.listen(PORT, () => console.log("🔥 MASTER AI RUNNING ON " + PORT));