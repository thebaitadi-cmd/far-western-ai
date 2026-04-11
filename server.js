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

// ===== INTENT =====
function detectIntent(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("image") || msg.includes("photo")) return "image";
  if (msg.includes("latest") || msg.includes("news") || msg.includes("today")) return "realtime";

  return "text";
}

// ===== GOOGLE =====
async function searchGoogle(q) {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q })
    });

    const data = await res.json();

    return data.organic?.slice(0, 3)
      .map(r => r.title + " - " + r.snippet)
      .join("\n");

  } catch {
    return null;
  }
}

// ===== MULTI AI =====
async function chatAI(prompt) {

  // 1️⃣ GROQ
  if (process.env.GROQ_KEYS) {
    for (let key of process.env.GROQ_KEYS.split(",")) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }]
          })
        });
        const d = await r.json();
        if (d.choices) return d.choices[0].message.content;
      } catch {}
    }
  }

  // 2️⃣ GEMINI
  if (process.env.GEMINI_KEY) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const d = await r.json();
      if (d.candidates) return d.candidates[0].content.parts[0].text;
    } catch {}
  }

  // 3️⃣ OPENROUTER
  if (process.env.OPENROUTER_KEYS) {
    for (let key of process.env.OPENROUTER_KEYS.split(",")) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/mistral-7b-instruct",
            messages: [{ role: "user", content: prompt }]
          })
        });
        const d = await r.json();
        if (d.choices) return d.choices[0].message.content;
      } catch {}
    }
  }

  return "❌ All AI failed";
}

// ===== IMAGE =====
async function generateImage(prompt) {
  try {
    const r = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        model: "stabilityai/stable-diffusion-xl-base-1.0"
      })
    });
    const d = await r.json();
    return d.data?.[0]?.url;
  } catch {
    return null;
  }
}

// ===== UPLOAD =====
async function analyzeImage(path) {
  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(path));

    const r = await fetch("https://api.deepai.org/api/image-recognition", {
      method: "POST",
      headers: { "api-key": process.env.DEEPAI_KEY },
      body: form
    });

    const d = await r.json();
    return JSON.stringify(d.output);

  } catch {
    return "❌ Image failed";
  }
}

// ===== ROUTE =====
app.post("/chat", async (req, res) => {
  const msg = req.body.message;
  const intent = detectIntent(msg);

  if (intent === "realtime") {
    const g = await searchGoogle(msg);
    if (g) {
      const final = await chatAI("Answer with latest info:\n" + g);
      return res.json({ reply: final });
    }
  }

  if (intent === "image") {
    const url = await generateImage(msg);
    return res.json({ image: url });
  }

  const reply = await chatAI(msg);
  res.json({ reply });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const result = await analyzeImage(req.file.path);
  res.json({ result });
});

app.listen(PORT, () => console.log("🔥 Running"));