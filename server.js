require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;

// ===== Helper =====
function getKeys(envKey) {
  return process.env[envKey] ? process.env[envKey].split(",") : [];
}

// ===== Chat API =====
app.post("/api/chat", async (req, res) => {
  const userMsg = req.body.message;

  // ===== 1. GROQ =====
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

  // ===== 2. OPENROUTER =====
  const openrouterKeys = getKeys("OPENROUTER_KEYS");

  for (let key of openrouterKeys) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b",
          messages: [{ role: "user", content: userMsg }]
        })
      });

      const data = await r.json();
      if (data.choices) {
        return res.json({ reply: data.choices[0].message.content });
      }
    } catch (e) {}
  }

  // ===== 3. SERPER (Google Search) =====
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: userMsg })
    });

    const data = await r.json();

    if (data.organic) {
      let text = data.organic
        .slice(0, 3)
        .map(x => x.title + " - " + x.snippet)
        .join("\n");

      return res.json({ reply: text });
    }
  } catch (e) {}

  return res.json({ reply: "⚠️ No AI response" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});