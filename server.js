import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// UPLOAD SETUP
const upload = multer({ dest: "uploads/" });

// 🔑 MULTI API KEYS
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

// 🧠 TEXT CHAT
app.post("/chat", async (req, res) => {
  const key = getKey();
  const { message } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply";

    res.json({ reply });
  } catch (err) {
    res.json({ reply: "Error" });
  }
});

// 🖼️ IMAGE READ
app.post("/upload", upload.single("image"), async (req, res) => {
  const key = getKey();
  const filePath = req.file.path;

  const base64 = fs.readFileSync(filePath, { encoding: "base64" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Explain this image" },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No result";

    res.json({ reply });
  } catch {
    res.json({ reply: "Error reading image" });
  }
});

// 🎨 IMAGE GENERATE (simple placeholder)
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  res.json({
    image: `https://dummyimage.com/512x512/000/fff&text=${encodeURIComponent(
      prompt
    )}`,
  });
});

// 🛠️ IMAGE EDIT
app.post("/edit-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;

  res.json({
    image: `https://dummyimage.com/512x512/333/fff&text=Edited:${encodeURIComponent(
      prompt
    )}`,
  });
});

// SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));