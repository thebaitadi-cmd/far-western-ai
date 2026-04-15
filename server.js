require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ ADVANCED CORS FIX (IMPORTANT)
app.use(cors({
  origin: "*", // abhi testing ke liye open (baad me domain dal sakte ho)
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

    // 👉 test reply (baad me AI laga denge)
    res.json({ reply: "AI: " + msg });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "⚠️ Server error" });
  }
});

// ✅ HEALTH CHECK (Render debugging ke liye)
app.get("/health", (req, res) => {
  res.send("OK");
});

// ✅ ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ PORT FIX (Render compatible)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 AI RUNNING ON PORT " + PORT);
});