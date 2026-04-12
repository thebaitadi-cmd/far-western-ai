require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const edgeTTS = require("edge-tts");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// =====================
// MEMORY
// =====================
let memory = [];

function addMemory(u, b) {
  memory.push({ u, b });
  if (memory.length > 10) memory.shift();
}

function getContext() {
  return memory.map(m => `User:${m.u}\nAI:${m.b}`).join("\n");
}

// =====================
// KEYS
// =====================
const split = (k) =>
  process.env[k]?.split(",").map(x => x.trim()).filter(Boolean) || [];

// =====================
// REALTIME DATA
// =====================
async function google(q) {
  try {
    if (!process.env.SERPER_KEY) return "";
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q })
    });
    const d = await r.json();
    return d?.organic?.map(x => x.snippet).join("\n") || "";
  } catch { return ""; }
}

async function news(q) {
  try {
    if (!process.env.NEWSDATA_KEY) return "";
    const r = await fetch(`https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_KEY}&q=${q}`);
    const d = await r.json();
    return d?.results?.map(x => x.title).join("\n") || "";
  } catch { return ""; }
}

// =====================
// 🤖 10 AI PROVIDERS
// =====================

// 1 GROQ
async function groq(p){
for(let k of split("GROQ_KEYS")){
try{
const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${k}`,"Content-Type":"application/json"},body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"user",content:p}]})});
const d=await r.json();
if(d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
}catch{}}
}

// 2 GEMINI
async function gemini(p){
try{
if(!process.env.GEMINI_KEY) return;
const r=await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
const d=await r.json();
return d?.candidates?.[0]?.content?.parts?.[0]?.text;
}catch{}}

// 3 OPENROUTER
async function openrouter(p){
for(let k of split("OPENROUTER_KEYS")){
try{
const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${k}`,"Content-Type":"application/json"},body:JSON.stringify({model:"mistralai/mistral-7b-instruct",messages:[{role:"user",content:p}]})});
const d=await r.json();
if(d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
}catch{}}
}

// 4 TOGETHER
async function together(p){
try{
if(!process.env.TOGETHER_KEY) return;
const r=await fetch("https://api.together.xyz/v1/completions",{method:"POST",headers:{Authorization:`Bearer ${process.env.TOGETHER_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"mistralai/Mixtral-8x7B-Instruct-v0.1",prompt:p,max_tokens:200})});
const d=await r.json();
return d?.choices?.[0]?.text;
}catch{}}

// 5 COHERE
async function cohere(p){
try{
if(!process.env.COHERE_KEY) return;
const r=await fetch("https://api.cohere.ai/v1/generate",{method:"POST",headers:{Authorization:`Bearer ${process.env.COHERE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"command",prompt:p,max_tokens:150})});
const d=await r.json();
return d?.generations?.[0]?.text;
}catch{}}

// 6 REPLICATE
async function replicate(p){
try{
if(!process.env.REPLICATE_KEY) return;
const r=await fetch("https://api.replicate.com/v1/predictions",{method:"POST",headers:{Authorization:`Token ${process.env.REPLICATE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({version:"meta/meta-llama-3-8b-instruct",input:{prompt:p}})});
const d=await r.json();
return JSON.stringify(d.output||"");
}catch{}}

// 7 DEEPAI
async function deepai(p){
try{
if(!process.env.DEEPAI_KEY) return;
const r=await fetch("https://api.deepai.org/api/text-generator",{method:"POST",headers:{"api-key":process.env.DEEPAI_KEY},body:new URLSearchParams({text:p})});
const d=await r.json();
return d.output;
}catch{}}

// 8 HUGGINGFACE
async function hf(p){
try{
if(!process.env.HF_KEY) return;
const r=await fetch("https://api-inference.huggingface.co/models/gpt2",{method:"POST",headers:{Authorization:`Bearer ${process.env.HF_KEY}`},body:JSON.stringify(p)});
const d=await r.json();
return d?.[0]?.generated_text;
}catch{}}

// 9 SERPAPI AI
async function serpapi(p){
try{
if(!process.env.SERPAPI_KEY) return;
const r=await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(p)}&api_key=${process.env.SERPAPI_KEY}`);
const d=await r.json();
return d?.organic_results?.map(x=>x.snippet).join(" ");
}catch{}}

// 10 FALLBACK
async function fallback(){return "System busy, retrying...";}

// =====================
// 🧠 MASTER AI (SMART)
// =====================
async function AI(prompt){

const ctx=getContext();
const [g,n]=await Promise.all([google(prompt),news(prompt)]);

const finalPrompt=`You are JARVIS AI.\n${ctx}\nUser:${prompt}\n${g}\n${n}`;

const providers=[groq,gemini,openrouter,together,cohere,replicate,deepai,hf,serpapi,fallback];

const results=await Promise.allSettled(providers.map(fn=>fn(finalPrompt)));

const outputs=results
.filter(r=>r.status==="fulfilled")
.map(r=>r.value)
.filter(Boolean);

const best=outputs.sort((a,b)=>b.length-a.length)[0];

return best || "Try again";
}

// =====================
// 🔊 VOICE
// =====================
app.post("/tts", async (req,res)=>{
const stream=await edgeTTS({
text:req.body.text,
voice:"en-IN-NeerjaNeural",
rate:"+5%"
});
res.setHeader("Content-Type","audio/mpeg");
stream.pipe(res);
});

// =====================
// CHAT
// =====================
app.post("/chat", async (req,res)=>{
const reply=await AI(req.body.message);
addMemory(req.body.message,reply);
res.json({reply});
});

app.listen(PORT,()=>console.log("🔥 10 AI JARVIS RUNNING"));