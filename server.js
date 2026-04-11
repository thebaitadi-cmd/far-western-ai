const express = require("express");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const FormData = require("form-data");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔥 10 KEYS (STRICT)
const KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY_8,
  process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10
];

let keyIndex = 0;
function getKey() {
  const key = KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % KEYS.length;
  return key;
}

// 🚀 MAIN ROUTE
app.post("/ai", upload.single("file"), async (req, res) => {
  try {
    let message = req.body.message || "";
    const file = req.file;
    const key = getKey();

    // 🎤 VOICE → Hindi/English/Nepali fix
    if (file && file.mimetype.startsWith("audio")) {
      const form = new FormData();
      form.append("file", file.buffer, "audio.webm");
      form.append("model", "whisper-large-v3");
      form.append("temperature", "0");
      form.append("response_format", "json");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`
          },
          body: form
        }
      );

      const data = await response.json();

      // 🔥 IMPORTANT FIX (language accuracy)
      message = data.text || "";
    }

    // 💬 CHAT (NO RANDOM LANGUAGE)
    const chat = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "Reply strictly in the SAME language as the user input. Do not change language."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const result = await chat.json();

    res.json({
      reply: result?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.log(err);
    res.json({ reply: "⚠️ Server Error" });
  }
});

// ROOT FIX (Render ke liye)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});