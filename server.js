require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.static("public"));

// ✅ CHAT API
app.post("/chat", async (req, res) => {
  const { msg } = req.body;

  try {
    // 👉 yaha apna AI logic already hoga (Gemini etc)
    // फिलहाल demo response:
    res.json({ reply: "AI: " + msg });

  } catch (err) {
    console.log(err);
    res.json({ reply: "⚠️ Error" });
  }
});

// ✅ ROOT FIX (important)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 🔥 PORT FIX (MOST IMPORTANT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 AI RUNNING ON PORT " + PORT);
});