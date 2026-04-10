import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// 🔥 Simple AI Reply (replace later with your API)
function getReply(message) {
  message = message.toLowerCase();

  if (message.includes("hello")) return "Hello! How can I help you?";
  if (message.includes("hi")) return "Hi there!";
  if (message.includes("who are you")) return "I am Far Western AI 🤖";
  if (message.includes("kaise ho")) return "Main badhiya hoon!";
  
  return "I understand: " + message;
}

// ✅ CHAT API
app.post("/chat", (req, res) => {
  const { message } = req.body;

  console.log("Message:", message);

  const reply = getReply(message);

  res.json({ reply });
});

// ✅ SERVER START
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});