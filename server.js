require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// 🧠 MEMORY (SMART LIMIT)
// =====================
let memory = [];

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 4) memory.shift(); // 🔥 reduce noise
}

function context(prompt) {
  return memory.map(m => `User:${m.u}\nAI:${m.b}`).join("\n") + "\nUser:" + prompt;
}

// =====================
// 🔑 HELPERS
// =====================
const split = (k) =>
  process.env[k]?.split(",").map(x => x.trim()).filter(Boolean) || [];

// =====================
// ✂️ CLEAN RESPONSE (STRICT)
// =====================
function clean(text) {
  if (!text) return "";

  return text
    .replace(/\n+/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/(1\.|2\.|3\.|4\.|5\.)/g, "")
    .replace(/AI:/gi, "")
    .trim()
    .slice(0, 150); // 🔥 tighter = smarter replies
}

// =====================
// 🤖 AI PROVIDERS (SMART)
// =====================

// 🔥 GROQ (FAST + BEST)
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

// 🔥 OPENROUTER (SMART FALLBACK)
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

// 🔥 GEMINI
async function gemini(prompt) {
  try {
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

// 🔥 COHERE (LAST)
async function cohere(prompt) {
  try {
    const r = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r",
        message: prompt,
        temperature: 0.4
      })
    });

    const d = await r.json();
    return d.text;
  } catch {}
}

// =====================
// 🎨 IMAGE
// =====================
async function image(prompt) {
  try {
    const r = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        model: "stabilityai/stable-diffusion-xl-base-1.0"
      })
    });

    const d = await r.json();
    if (d.data) return d.data[0].url;
  } catch {}
}

// =====================
// 🧠 MAIN AI (ULTRA FIX)
// =====================
async function AI(prompt) {

  const systemRule = `
You are a smart assistant.

Rules:
- Reply in SAME language as user
- Hinglish → Hinglish
- Nepali → Nepali
- English → English

- Answer SHORT (max 1–2 lines)
- Be direct & helpful
- NO extra explanation
- NO random बात
`;

  const fullPrompt = systemRule + "\n" + prompt;

  let r;

  // 🔥 BEST ORDER
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
// ROUTES
// =====================
app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  if (!msg) return res.json({ reply: "Say something" });

  // image detect
  if (msg.toLowerCase().includes("image")) {
    const url = await image(msg);
    return res.json({ image: url });
  }

  const reply = await AI(msg);

  addMemory(msg, reply);

  res.json({ reply });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const result = await analyze(req.file.path);
  res.json({ result });
});

app.listen(PORT, () => console.log("🔥 ULTRA AI RUNNING"));