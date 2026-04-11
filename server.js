require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 10000;

function getKeys(envKey) {
  return process.env[envKey] ? process.env[envKey].split(",") : [];
}

// ================= CHAT =================
app.post("/api/chat", async (req, res) => {
  const userMsg = req.body.message;

  const groqKeys = getKeys("GROQ_KEYS");

  for (let key of groqKeys) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: userMsg }]
        })
      });

      const data = await r.json();
      if (data.choices) {
        return res.json({ reply: data.choices[0].message.content });
      }
    } catch (e) {}
  }

  return res.json({ reply: "⚠️ No AI response" });
});

// ================= IMAGE ANALYZE =================
app.post("/api/image", upload.single("image"), async (req, res) => {
  try {
    const r = await fetch("https://api.deepai.org/api/densecap", {
      method: "POST",
      headers: {
        "Api-Key": process.env.DEEPAI_KEY
      },
      body: new URLSearchParams({
        image: req.file.path
      })
    });

    const data = await r.json();

    let text = data.output.captions
      .slice(0, 3)
      .map(x => x.caption)
      .join(", ");

    res.json({ reply: text });

  } catch (e) {
    res.json({ reply: "Image analyze error" });
  }
});

// ================= IMAGE GENERATE =================
app.post("/api/generate-image", async (req, res) => {
  try {
    const r = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Api-Key": process.env.DEEPAI_KEY
      },
      body: new URLSearchParams({
        text: req.body.prompt
      })
    });

    const data = await r.json();

    res.json({ image: data.output_url });

  } catch (e) {
    res.json({ error: "Image generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});