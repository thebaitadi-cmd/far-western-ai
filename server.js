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

// ======================
// 🔥 TEXT AI (GROQ FIXED + FALLBACK)
// ======================
async function chatAI(prompt) {

  if (!process.env.GROQ_KEYS) {
    return "❌ No GROQ keys found";
  }

  const keys = process.env.GROQ_KEYS.split(",");

  // ✅ Working models (NEW)
  const models = [
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant"
  ];

  for (let model of models) {
    for (let key of keys) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await res.json();

        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        } else {
          console.log("MODEL FAILED:", model, data);
        }

      } catch (err) {
        console.log("ERROR:", err.message);
      }
    }
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

  } catch (err) {
    console.log("IMAGE ERROR:", err.message);
    return null;
  }
}

// ======================
// 🧠 IMAGE ANALYSIS
// ======================
async function analyzeImage(filePath) {
  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));

    const res = await fetch("https://api.deepai.org/api/image-recognition", {
      method: "POST",
      headers: { "api-key": process.env.DEEPAI_KEY },
      body: form
    });

    const data = await res.json();
    return JSON.stringify(data.output);

  } catch (err) {
    console.log("ANALYSIS ERROR:", err.message);
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

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});