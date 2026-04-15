require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ FIX CORS
app.use(cors());

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.static("public"));

// ✅ CHAT API
app.post("/chat", async (req, res) => {
  const { msg } = req.body;

  try {
    res.json({ reply: "AI: " + msg });
  } catch (err) {
    res.json({ reply: "⚠️ Error" });
  }
});

// ✅ ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 AI RUNNING ON PORT " + PORT);
});