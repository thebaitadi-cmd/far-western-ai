import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";

import aiRouter from "./utils/aiRouter.js";

const app = express();

// ✅ CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-user-id"]
}));

// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 🧠 CHAT API (ONLY ROUTER CALL)
app.post("/chat", async (req, res) => {
  try {
    const { msg } = req.body;
    const userId = req.headers["x-user-id"] || "default";

    if (!msg) {
      return res.json({ reply: "⚠️ Empty message" });
    }

    // 👉 ALL INTELLIGENCE MOVED TO aiRouter
    const reply = await aiRouter({
      msg,
      userId
    });

    res.json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ reply: "⚠️ Server crash error" });
  }
});

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.send("OK");
});

// ✅ FRONTEND
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 PRO MAX AI RUNNING ON PORT " + PORT);
});