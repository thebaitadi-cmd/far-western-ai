import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// 🔑 10 API KEYS
const API_KEYS = [
  "key1",
  "key2",
  "key3",
  "key4",
  "key5",
  "key6",
  "key7",
  "key8",
  "key9",
  "key10"
];

let currentKey = 0;

// 🚀 Chat API
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const apiKey = API_KEYS[currentKey];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // 🔁 Key rotate
    currentKey = (currentKey + 1) % API_KEYS.length;

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "❌ AI error";

    res.json({ reply });
  } catch (err) {
    res.json({ reply: "❌ Server error" });
  }
});

// 🚀 ROOT FIX (IMPORTANT)
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));