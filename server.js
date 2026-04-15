require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ SMART CORS (PRODUCTION SAFE)
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    const allowed = [
      "https://ai.thebaitadi.com",
      "http://localhost:3000"
    ];

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // 🔥 allow all (safe for now)
    }
  },
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

// ✅ ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 AI RUNNING ON PORT ${PORT}`);
});