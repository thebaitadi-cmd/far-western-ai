import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// 🔥 10 API KEYS
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

let index = 0;
function getKey() {
  const key = KEYS[index];
  index = (index + 1) % KEYS.length;
  return key;
}

// ✅ MAIN AI ROUTE
app.post("/ai", upload.single("file"), async (req, res) => {
  try {
    let message = req.body.message || "";
    const file = req.file;
    const key = getKey();

    // 🎤 VOICE
    if (file && file.mimetype.startsWith("audio")) {
      const form = new FormData();
      form.append("file", file.buffer, {
        filename: "audio.webm"
      });
      form.append("model", "whisper-large-v3");

      const whisper = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${key}`
          },
          body: form
        }
      );

      const wData = await whisper.json();
      message = wData.text;
    }

    // 🖼 IMAGE
    if (file && file.mimetype.startsWith("image")) {
      const base64 = file.buffer.toString("base64");

      const vision = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: message || "Explain this image" },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64}`
                  }
                }
              ]
            }]
          })
        }
      );

      const vData = await vision.json();
      return res.json({ reply: vData.choices[0].message.content });
    }

    // 💬 CHAT
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
          messages: [{ role: "user", content: message }]
        })
      }
    );

    const cData = await chat.json();

    res.json({
      reply: cData.choices[0].message.content,
      userText: message
    });

  } catch (err) {
    console.log(err);
    res.json({ reply: "⚠️ AI Error" });
  }
});

// root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(process.env.PORT || 3000);