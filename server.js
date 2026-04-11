require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Convert keys string → array
const groqKeys = process.env.GROQ_KEYS ? process.env.GROQ_KEYS.split(",") : [];
const openrouterKeys = process.env.OPENROUTER_KEYS ? process.env.OPENROUTER_KEYS.split(",") : [];

// 🔁 Try GROQ keys one by one
async function tryGroq(prompt) {
  for (let key of groqKeys) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();

      if (data.choices) {
        return data.choices[0].message.content;
      }

    } catch (err) {
      console.log("Groq failed:", key);
    }
  }
  return null;
}

// 🔁 Try OpenRouter keys
async function tryOpenRouter(prompt) {
  for (let key of openrouterKeys) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();

      if (data.choices) {
        return data.choices[0].message.content;
      }

    } catch (err) {
      console.log("OpenRouter failed:", key);
    }
  }
  return null;
}

// 🔥 MAIN API
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // 1️⃣ GROQ
    let reply = await tryGroq(message);
    if (reply) return res.json({ reply });

    // 2️⃣ OPENROUTER
    reply = await tryOpenRouter(message);
    if (reply) return res.json({ reply });

    // ❌ All failed
    return res.json({ reply: "❌ All API keys failed" });

  } catch (err) {
    return res.json({ reply: "❌ Server error" });
  }
});

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => console.log("Server running 🚀"));