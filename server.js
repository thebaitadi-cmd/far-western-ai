const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ STATIC FIX (IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

// 🔥 HOME ROUTE FIX (MAIN PROBLEM SOLVED)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 API
app.post("/api/chat", (req, res) => {
  const msg = req.body.message;

  res.json({
    reply: "🤖 AI: " + msg
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});