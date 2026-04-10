const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ KEY ROTATION
const groqKeys = process.env.GROQ_KEYS.split(",");
let index = 0;

function getKey() {
  const key = groqKeys[index];
  index = (index + 1) % groqKeys.length;
  return key;
}

// ✅ CHAT API (REAL AI)
app.post("/api/chat", async (req, res) => {
  try {
    const userMsg = req.body.message;

    const apiKey = getKey();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a smart AI assistant." },
          { role: "user", content: userMsg }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "Error";

    res.json({ reply });

  } catch (err) {
    console.log(err);
    res.json({ reply: "Server error 😢" });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});