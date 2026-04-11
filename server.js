console.log("=== ENV CHECK ===");
console.log("GROQ_KEYS:", process.env.GROQ_KEYS);
console.log("GEMINI_KEY:", process.env.GEMINI_KEY);
console.log("TOGETHER_KEY:", process.env.TOGETHER_KEY);
require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ======================
// 🔥 TEXT AI (10 API AUTO FALLBACK)
// ======================
async function chatAI(prompt) {

  // ===== 1. GROQ =====
  if (process.env.GROQ_KEYS) {
    const keys = process.env.GROQ_KEYS.split(",");
    for (let key of keys) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await res.json();
        if (data.choices) return data.choices[0].message.content;
      } catch {}
    }
  }

  // ===== 2. OPENROUTER =====
  if (process.env.OPENROUTER_KEYS) {
    const keys = process.env.OPENROUTER_KEYS.split(",");
    for (let key of keys) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

        const data = await res.json();
        if (data.choices) return data.choices[0].message.content;
      } catch {}
    }
  }

  // ===== 3. GEMINI =====
  if (process.env.GEMINI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await res.json();
      if (data.candidates) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch {}
  }

  // ===== 4. COHERE =====
  if (process.env.COHERE_KEY) {
    try {
      const res = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.COHERE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: prompt,
          model: "command-r"
        })
      });

      const data = await res.json();
      if (data.text) return data.text;
    } catch {}
  }

  return "❌ All AI APIs failed";
}

// ======================
// 🖼 IMAGE GENERATE
// ======================
async function generateImage(prompt) {
  if (!process.env.TOGETHER_KEY) return null;

  try {
    const res = await fetch("https://api.together.xyz/v1/images/generations", {
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

    const data = await res.json();
    return data.data?.[0]?.url || null;

  } catch {
    return null;
  }
}

// ======================
// 🧠 IMAGE ANALYSIS
// ======================
async function analyzeImage(filePath) {
  try {
    const form = new FormData();
    form.append("image", require("fs").createReadStream(filePath));

    const res = await fetch("https://api.deepai.org/api/image-recognition", {
      method: "POST",
      headers: { "api-key": process.env.DEEPAI_KEY },
      body: form
    });

    const data = await res.json();
    return JSON.stringify(data.output);

  } catch {
    return "❌ Image analysis failed";
  }
}

// ======================
// 🚀 ROUTES
// ======================

// TEXT CHAT
app.post("/chat", async (req, res) => {
  const reply = await chatAI(req.body.message);
  res.json({ reply });
});

// IMAGE GENERATE
app.post("/generate-image", async (req, res) => {
  const url = await generateImage(req.body.prompt);
  res.json({ url });
});

// IMAGE UPLOAD + ANALYZE
app.post("/upload", upload.single("image"), async (req, res) => {
  const result = await analyzeImage(req.file.path);
  res.json({ result });
});

app.listen(PORT, () => console.log("🔥 Server running"));