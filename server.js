import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// 🔑 10 API KEYS
const API_KEYS = [
  "PASTE_KEY_1",
  "PASTE_KEY_2",
  "PASTE_KEY_3",
  "PASTE_KEY_4",
  "PASTE_KEY_5",
  "PASTE_KEY_6",
  "PASTE_KEY_7",
  "PASTE_KEY_8",
  "PASTE_KEY_9",
  "PASTE_KEY_10"
];

// 🚀 FUNCTION: TRY ALL KEYS (IMPORTANT FIX)
async function askAI(message) {
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: message }]
              }
            ]
          })
        }
      );

      const data = await response.json();

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return reply; // ✅ SUCCESS
      }

    } catch (err) {
      console.log("Key failed, trying next...");
    }
  }

  return "❌ All API keys failed";
}

// 🚀 CHAT ROUTE
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await askAI(message);

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "❌ Server error" });
  }
});

// 🚀 ROOT FIX (VERY IMPORTANT FOR RENDER)
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));