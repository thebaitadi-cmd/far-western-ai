require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;

// KEYS
const GROQ_KEYS = process.env.GROQ_KEYS?.split(",") || [];
const OPENROUTER_KEYS = process.env.OPENROUTER_KEYS?.split(",") || [];
const GEMINI_KEY = process.env.GEMINI_KEY;
const TOGETHER_KEY = process.env.TOGETHER_KEY;
const COHERE_KEY = process.env.COHERE_KEY;

let groqIndex = 0;
let openIndex = 0;

function nextKey(list, indexRef) {
  const key = list[indexRef.value];
  indexRef.value = (indexRef.value + 1) % list.length;
  return key;
}

// MAIN CHAT
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  // 🔹 1. GROQ
  try {
    if (GROQ_KEYS.length > 0) {
      const key = GROQ_KEYS[groqIndex];
      groqIndex = (groqIndex + 1) % GROQ_KEYS.length;

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: message }],
        }),
      });

      const d = await r.json();
      if (d.choices) return res.json({ reply: d.choices[0].message.content });
    }
  } catch (e) {
    console.log("GROQ FAIL");
  }

  // 🔹 2. OPENROUTER
  try {
    if (OPENROUTER_KEYS.length > 0) {
      const key = OPENROUTER_KEYS[openIndex];
      openIndex = (openIndex + 1) % OPENROUTER_KEYS.length;

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [{ role: "user", content: message }],
        }),
      });

      const d = await r.json();
      if (d.choices) return res.json({ reply: d.choices[0].message.content });
    }
  } catch (e) {
    console.log("OPENROUTER FAIL");
  }

  // 🔹 3. GEMINI
  try {
    if (GEMINI_KEY) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      });

      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.json({ reply: text });
    }
  } catch (e) {
    console.log("GEMINI FAIL");
  }

  // 🔹 4. TOGETHER
  try {
    if (TOGETHER_KEY) {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.1",
          messages: [{ role: "user", content: message }],
        }),
      });

      const d = await r.json();
      if (d.choices) return res.json({ reply: d.choices[0].message.content });
    }
  } catch (e) {
    console.log("TOGETHER FAIL");
  }

  // 🔹 5. COHERE
  try {
    if (COHERE_KEY) {
      const r = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COHERE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const d = await r.json();
      if (d.text) return res.json({ reply: d.text });
    }
  } catch (e) {
    console.log("COHERE FAIL");
  }

  // ❌ FINAL FAIL
  res.json({ reply: "All AI services failed 😢" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});