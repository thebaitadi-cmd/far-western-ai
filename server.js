import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 10 API KEYS
const API_KEYS = [
  process.env.KEY1,
  process.env.KEY2,
  process.env.KEY3,
  process.env.KEY4,
  process.env.KEY5,
  process.env.KEY6,
  process.env.KEY7,
  process.env.KEY8,
  process.env.KEY9,
  process.env.KEY10
].filter(Boolean);

// 👉 Random key
function getKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

app.get("/", (req, res) => {
  res.send("Far Western AI Server Running 🚀");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getKey()}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // ✅ latest working
          messages: [
            {
              role: "system",
              content: "Reply in same language (Hindi, English, Nepali)."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.choices) {
      return res.json({ reply: "API Error: " + JSON.stringify(data) });
    }

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ reply: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running 🚀");
});