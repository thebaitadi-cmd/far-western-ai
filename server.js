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

// ===== SAFE KEY PARSER =====
function getKeys(envVar) {
  if (!envVar) return [];
  return envVar.split(",").map(k => k.trim()).filter(Boolean);
}

// ===== TEXT AI (MULTI FALLBACK) =====
async function chatAI(prompt) {

  // 1️⃣ GROQ
  const groqKeys = getKeys(process.env.GROQ_KEYS);

  for (let key of groqKeys) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // ✅ working model
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

    } catch (err) {
      console.log("Groq failed");
    }
  }

  // 2️⃣ COHERE FALLBACK
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
      if (data?.text) return data.text;

    } catch {
      console.log("Cohere failed");
    }
  }

  return "❌ All AI APIs failed";
}

// ===== IMAGE GENERATE =====
async function generateImage(prompt) {
  try {
    const res = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        width: 1024,
        height: 1024
      })
    });

    const data = await res.json();

    if (data?.data?.[0]?.url) {
      return data.data[0].url;
    }

    return null;

  } catch {
    return null;
  }
}

// ===== IMAGE ANALYSIS =====
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

    return data?.output
      ? JSON.stringify(data.output)
      : "No result";

  } catch {
    return "❌ Image analysis failed";
  }
}

// ===== ROUTES =====

// TEXT CHAT
app.post("/chat", async (req, res) => {
  try {
    const reply = await chatAI(req.body.message);
    res.json({ reply });
  } catch {
    res.json({ reply: "❌ Server error" });
  }
});

// IMAGE GENERATE
app.post("/generate-image", async (req, res) => {
  try {
    const url = await generateImage(req.body.prompt);
    res.json({ url });
  } catch {
    res.json({ url: null });
  }
});

// IMAGE UPLOAD + ANALYZE
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await analyzeImage(req.file.path);

    // delete file after use
    fs.unlinkSync(req.file.path);

    res.json({ result });

  } catch {
    res.json({ result: "❌ Upload error" });
  }
});

app.listen(PORT, () => console.log("🔥 Server running on port " + PORT));