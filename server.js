import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ✅ MULTI API KEY SYSTEM (10 KEYS)
const keys = [
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
  process.env.API_KEY_4,
  process.env.API_KEY_5,
  process.env.API_KEY_6,
  process.env.API_KEY_7,
  process.env.API_KEY_8,
  process.env.API_KEY_9,
  process.env.API_KEY_10,
];

let keyIndex = 0;
function getKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

// ✅ TEXT CHAT
app.post("/chat", async (req, res) => {
  try {
    const key = getKey();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: req.body.message }],
        }),
      }
    );

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    res.json({ reply: "Error AI" });
  }
});

// ✅ IMAGE READ
app.post("/upload", upload.single("image"), async (req, res) => {
  res.json({ reply: "Image received ✅ (AI read placeholder)" });
});

// ✅ IMAGE GENERATE (dummy free)
app.post("/generate-image", async (req, res) => {
  const prompt = req.body.prompt;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}`;
  res.json({ image: url });
});

// ✅ IMAGE EDIT
app.post("/edit-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}`;
  res.json({ image: url });
});

app.listen(10000, () => console.log("Server running on 10000"));