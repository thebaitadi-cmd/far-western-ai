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
  if (memory.length > 10) memory.shift();
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
// ✂️ CLEAN (NO CUT 🔥)
// =====================
function clean(text) {
  if (!text) return "";

  return text
    .replace(/\n+/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/AI:/gi, "")
    .trim(); // ❌ no slice
}

// =====================
// 🌐 GOOGLE REALTIME
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
        message: prompt
      })
    });

    const d = await r.json();
    return d.text;
  } catch {}
}

// =====================
// 🧠 INTENT DETECTION
// =====================
async function detectIntent(prompt) {
  const res = await groq(`
Classify intent:
- realtime
- summary
- normal

User: "${prompt}"
Answer one word only.
`);

  return res?.toLowerCase().trim();
}

// =====================
// 🧠 PARALLEL AI
// =====================
async function parallel(prompt) {
  const results = await Promise.all([
    groq(prompt),
    openrouter(prompt),
    gemini(prompt),
    cohere(prompt)
  ]);

  return results.filter(Boolean);
}

// =====================
// 🧠 BEST ANSWER (SMART 🔥)
// =====================
function pickBest(arr) {
  if (!arr.length) return null;

  return arr.sort((a, b) => {
    let scoreA = a.length + (a.includes("I don't know") ? -50 : 0);
    let scoreB = b.length + (b.includes("I don't know") ? -50 : 0);
    return scoreB - scoreA;
  })[0];
}

// =====================
// 🧠 MASTER AI
// =====================
async function AI(prompt) {

  const intent = await detectIntent(prompt);
  const ctx = getContext();

  let extra = "";

  // 🔥 REALTIME FORCE
  const g = await google(prompt);
  if (g) {
    extra = "\nREAL DATA:\n" + g;
  }

  if (intent === "summary") {
    prompt = `Summarize in 1 line:\n${ctx}`;
  }

  const finalPrompt = `
You are an ADVANCED AI.

STRICT RULES:
- NEVER GUESS
- If not sure → say "I don't know"
- Use real data if available
- Natural human tone
- Same language

Conversation:
${ctx}

User: ${prompt}

${extra}
`;

  const responses = await parallel(finalPrompt);
  let best = pickBest(responses);

  return clean(best || "I don't know");
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

app.listen(PORT, () => console.log("🔥 MASTER AI v2 RUNNING ON " + PORT));