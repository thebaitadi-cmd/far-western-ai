require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ CORS (CUSTOM DOMAIN FIX)
app.use(cors({
  origin: [
    "https://ai.tyhebaitadi.com",   // 👈 tumhara domain
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ CHAT API
app.post("/chat", async (req, res) => {
  const { msg } = req.body;

  try {
    if (!msg) {
      return res.json({ reply: "⚠️ Empty message" });
    }

    // 👉 test reply (AI baad me connect karenge)
    res.json({ reply: "AI: " + msg });

  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ reply: "⚠️ Server error" });
  }
});

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.send("OK");
});

// ✅ ROOT (Frontend load)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ PORT FIX (Render Compatible)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 AI RUNNING ON PORT ${PORT}`);
});