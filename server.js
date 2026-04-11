require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;

// KEYS
const GROQ_KEYS = process.env.GROQ_KEYS ? process.env.GROQ_KEYS.split(",") : [];
const OPENROUTER_KEYS = process.env.OPENROUTER_KEYS ? process.env.OPENROUTER_KEYS.split(",") : [];
const GEMINI_KEY = process.env.GEMINI_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPER_KEY = process.env.SERPER_KEY;
const NEWSDATA_KEY = process.env.NEWSDATA_KEY;
const REPLICATE_KEY = process.env.REPLICATE_KEY;

// RANDOM KEY
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ================= AI =================
async function askAI(prompt) {

  // GEMINI (BEST FREE)
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    if (data.candidates) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (e) {}

  // GROQ
  try {
    const key = getRandom(GROQ_KEYS);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    if (data.choices) return data.choices[0].message.content;
  } catch (e) {}

  return "❌ AI error";
}

// ================= GOOGLE SEARCH =================
async function googleSearch(query) {
  try {
    if (SERPER_KEY) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: query })
      });
      const data = await res.json();
      return data.organic?.slice(0, 3).map(x => x.snippet).join("\n");
    }

    if (SERPAPI_KEY) {
      const res = await fetch(`https://serpapi.com/search.json?q=${query}&api_key=${SERPAPI_KEY}`);
      const data = await res.json();
      return data.organic_results?.slice(0, 3).map(x => x.snippet).join("\n");
    }

  } catch (e) {}

  return null;
}

// ================= NEWS =================
async function getNews(query) {
  try {
    const res = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${query}`);
    const data = await res.json();
    return data.results?.slice(0, 3).map(n => n.title).join("\n");
  } catch (e) {}
  return null;
}

// ================= IMAGE =================
async function generateImage(prompt) {
  try {
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl",
        input: { prompt }
      })
    });

    const data = await res.json();
    return data.urls?.get || "Generating...";
  } catch (e) {
    return "❌ Image error";
  }
}

// ================= SMART ROUTING =================
function isNews(query) {
  return query.toLowerCase().includes("news") || query.includes("today");
}

// ================= ROUTES =================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  let reply;

  // NEWS
  if (isNews(message)) {
    const news = await getNews(message);
    if (news) {
      reply = "📰 Latest News:\n" + news;
      return res.json({ reply });
    }
  }

  // GOOGLE SEARCH
  const search = await googleSearch(message);

  if (search) {
    const ai = await askAI(message + "\n\nUse this data:\n" + search);
    return res.json({ reply: ai });
  }

  // NORMAL AI
  reply = await askAI(message);

  res.json({ reply });
});

// IMAGE
app.post("/image", async (req, res) => {
  const { prompt } = req.body;
  const img = await generateImage(prompt);
  res.json({ image: img });
});

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});