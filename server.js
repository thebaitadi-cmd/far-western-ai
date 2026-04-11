require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// 🧠 MEMORY
// =====================
let memory = [];

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 6) memory.shift();
}

function context(prompt) {
  return memory.map(m => `User:${m.u}\nAI:${m.b}`).join("\n") + "\nUser:" + prompt;
}

// =====================
// 🔑 HELPERS
// =====================
const split = (k) =>
  process.env[k]?.split(",").map(x => x.trim()).filter(Boolean) || [];

// =====================
// ✂️ CLEAN RESPONSE
// =====================
function clean(text) {
  return text
    .replace(/\n{2,}/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .replace(/(1\.|2\.|3\.|4\.|5\.)/g, "")
    .trim()
    .slice(0, 180); // 🔥 short reply hard limit
}

// =====================
// 🌐 GOOGLE
// =====================
async function google(q) {
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q })
    });
    const d = await r.json();
    return d.organic?.map(x => x.snippet).join("\n") || "";
  } catch { return ""; }
}

// =====================
// 📰 NEWS
// =====================
async function news(q) {
  try {
    const r = await fetch(`https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_KEY}&q=${q}`);
    const d = await r.json();
    return d.results?.slice(0,3).map(n => n.title).join("\n") || "";
  } catch { return ""; }
}

// =====================
// 🤖 AI PROVIDERS
// =====================
async function groq(prompt) {
  for (let key of split("GROQ_KEYS")) {
    for (let model of ["llama-3.1-8b-instant","llama-3.1-70b-versatile"]) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:"POST",
          headers:{
            Authorization:`Bearer ${key}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            model,
            messages:[{role:"user",content:prompt}]
          })
        });
        const d = await r.json();
        if (d.choices) return d.choices[0].message.content;
      } catch {}
    }
  }
}

async function openrouter(prompt) {
  for (let key of split("OPENROUTER_KEYS")) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:"POST",
        headers:{
          Authorization:`Bearer ${key}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"openai/gpt-4o-mini",
          messages:[{role:"user",content:prompt}]
        })
      });
      const d = await r.json();
      if (d.choices) return d.choices[0].message.content;
    } catch {}
  }
}

async function gemini(prompt) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}]
      })
    });
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {}
}

async function cohere(prompt) {
  try {
    const r = await fetch("https://api.cohere.ai/v1/chat", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.COHERE_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"command-r",
        message:prompt
      })
    });
    const d = await r.json();
    return d.text;
  } catch {}
}

// =====================
// 🎨 IMAGE
// =====================
async function image(prompt) {
  try {
    const r = await fetch("https://api.together.xyz/v1/images/generations", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.TOGETHER_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        prompt,
        model:"stabilityai/stable-diffusion-xl-base-1.0"
      })
    });
    const d = await r.json();
    if (d.data) return d.data[0].url;
  } catch {}

  try {
    const r = await fetch("https://api.replicate.com/v1/predictions", {
      method:"POST",
      headers:{
        Authorization:`Token ${process.env.REPLICATE_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        version:"stability-ai/sdxl",
        input:{prompt}
      })
    });
    const d = await r.json();
    return d.urls?.get;
  } catch {}
}

// =====================
// 🖼 IMAGE ANALYSIS
// =====================
async function analyze(path) {
  const form = new FormData();
  form.append("image", fs.createReadStream(path));

  const r = await fetch("https://api.deepai.org/api/image-recognition", {
    method:"POST",
    headers:{ "api-key": process.env.DEEPAI_KEY },
    body:form
  });

  const d = await r.json();
  return JSON.stringify(d.output);
}

// =====================
// 🧠 MAIN AI (FINAL)
// =====================
async function AI(prompt) {

  let extra = "";

  if (
    prompt.toLowerCase().includes("news") ||
    prompt.toLowerCase().includes("latest") ||
    prompt.toLowerCase().includes("today") ||
    prompt.toLowerCase().includes("recent")
  ) {
    const g = await google(prompt);
    const n = await news(prompt);
    extra = g + "\n" + n;
  }

  const systemRule = `
You are a smart AI assistant.

STRICT RULES:
- Detect user's language EXACTLY
- Reply ONLY in same language (no mixing)
- If Hinglish → reply Hinglish
- If Nepali → reply Nepali
- NEVER translate unless asked

- Keep answer VERY SHORT (1–2 lines max)
- Natural human tone
- Proper spacing
- NO long paragraphs
- NO numbering
`;

  const full = systemRule + "\n" + context(prompt + "\n" + extra);

  let r;

  r = await groq(full);
  if (r) return clean(r);

  r = await openrouter(full);
  if (r) return clean(r);

  r = await gemini(full);
  if (r) return clean(r);

  r = await cohere(full);
  if (r) return clean(r);

  return "❌ AI failed";
}

// =====================
// ROUTES
// =====================
app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  if (msg.toLowerCase().includes("image")) {
    const url = await image(msg);
    return res.json({ image: url });
  }

  const reply = await AI(msg);
  addMemory(msg, reply);

  res.json({ reply });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const result = await analyze(req.file.path);
  res.json({ result });
});

app.listen(PORT, () => console.log("🔥 FINAL AI RUNNING"));