import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;

// ✅ TEXT CHAT
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    res.status(500).json({ error: "AI Error" });
  }
});

// ✅ IMAGE GENERATE (dummy free fallback)
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  // free demo image
  res.json({
    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
  });
});

// ✅ IMAGE EDIT (ChatGPT style fake edit)
app.post("/edit-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt;

  // demo edited image
  res.json({
    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " edited version")}`
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});