import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

/* 🌍 LANGUAGE DETECT */
function detectLang(text) {
  if (text.match(/[अ-ह]/)) return "hi";
  if (text.match(/[क-ह]/)) return "ne";
  return "en";
}

/* 🤖 AI RESPONSE */
async function askAI(message) {
  const apis = [
    async () => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_KEYS}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: message }]
        })
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    },

    async () => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_KEYS}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: message }]
        })
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    }
  ];

  for (let api of apis) {
    try {
      let result = await api();
      if (result) return result;
    } catch (e) {
      continue;
    }
  }

  return "AI error, try again";
}

/* 🚀 MAIN CHAT API */
app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.message || "";

    const lang = detectLang(userText);

    let prompt = userText;

    if (lang === "hi") prompt = "Hindi me jawab do: " + userText;
    if (lang === "ne") prompt = "Nepali ma answer deu: " + userText;

    const reply = await askAI(prompt);

    // 🧠 CLEAN TEXT (important for python)
    const safeText = reply.replace(/["'`]/g, "");

    // 🔊 TTS GENERATE
    exec(`python tts.py "${safeText}"`, (err) => {
      if (err) {
        console.log("TTS ERROR:", err);
        return res.json({
          reply,
          audio: null
        });
      }

      // ✅ DIRECT FILE RETURN (BEST METHOD)
      res.json({
        reply,
        audio: "/output.mp3"
      });
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.json({
      reply: "Server error",
      audio: null
    });
  }
});

/* 🚀 START SERVER */
app.listen(3000, () => {
  console.log("🔥 FINAL AI RUNNING ON http://localhost:3000");
});