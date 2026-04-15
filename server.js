import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { spawn } from "child_process";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔑 KEYS
const GROQ_KEYS = process.env.GROQ_KEYS?.split(",") || [];

// 🔥 FAST + WORKING MODELS ONLY
const MODELS = [
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma-7b-it"
];

// 🔁 KEY ROTATION
let keyIndex = 0;
function getNextKey() {
  if (GROQ_KEYS.length === 0) throw new Error("No API keys");
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
}

// ⏱️ FETCH WITH TIMEOUT
async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 🧠 AI RESPONSE (FAST + SINGLE SUCCESS)
async function getAIResponse(msg) {
  if (!msg) return "⚠️ Empty message";

  for (let i = 0; i < GROQ_KEYS.length; i++) {
    const key = getNextKey();

    for (let model of MODELS) {
      try {
        const res = await fetchWithTimeout(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: msg }]
            })
          }
        );

        const data = await res.json();

        if (data.error) {
          console.log(`❌ ${model}: ${data.error.message}`);
          continue;
        }

        const reply = data.choices?.[0]?.message?.content;

        if (reply) {
          console.log(`✅ SUCCESS → ${model}`);
          return reply;
        }

      } catch (err) {
        console.log(`⚠️ ERROR → ${model}: ${err.message}`);
      }
    }
  }

  return "⚠️ AI not responding";
}

// 💬 TEXT ROUTE
app.post("/chat", async (req, res) => {
  try {
    const msg = req.body.msg;
    const reply = await getAIResponse(msg);
    res.json({ reply });
  } catch (err) {
    res.json({ reply: "⚠️ Server error" });
  }
});

// 🔊 VOICE ROUTE (SAFE)
app.get("/voice", (req, res) => {
  const text = req.query.text;

  if (!text) {
    res.status(400).end();
    return;
  }

  res.setHeader("Content-Type", "audio/mpeg");

  const py = spawn("python", ["tts_stream.py", text]);

  py.stdout.on("data", (chunk) => {
    res.write(chunk);
  });

  py.on("close", () => {
    res.end();
  });

  py.on("error", () => {
    res.end();
  });

  py.stderr.on("data", (err) => {
    console.log("TTS ERROR:", err.toString());
  });
});

// 🚀 START SERVER
app.listen(3000, () => {
  console.log("🔥 AI running → http://localhost:3000");
});