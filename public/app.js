const input = document.getElementById("msg");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const overlay = document.getElementById("voiceOverlay");

let recognition = null;
let isListening = false;
let isSpeaking = false;

// 🧠 UNIQUE USER ID (memory ke liye)
let userId = localStorage.getItem("fw_user");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("fw_user", userId);
}

// 🌐 DOMAIN
const API_URL = "https://ai.thebaitadi.com";

// 🧠 ADD MESSAGE UI
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "msg " + sender;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 💬 TEXT MODE
async function sendText() {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  input.value = "";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId // 🔥 memory connect
      },
      body: JSON.stringify({ msg })
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    addMessage(data.reply, "bot");

  } catch {
    addMessage("⚠️ Server not responding", "bot");
  }
}

// 🎤 START MIC (FIXED)
function startMic() {
  if (isListening) return;

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = "en-US";

  input.style.display = "none";
  sendBtn.style.display = "none";
  overlay.classList.remove("hidden");

  micBtn.innerText = "🛑 Stop"; // ✅ FIX

  recognition.onresult = async (event) => {
    if (isSpeaking) return;

    const text = event.results[event.results.length - 1][0].transcript;

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ msg: text })
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      recognition.stop();
      isSpeaking = true;

      const speech = new SpeechSynthesisUtterance(data.reply);

      speech.onend = () => {
        isSpeaking = false;
        if (isListening) recognition.start();
      };

      speechSynthesis.cancel(); // 🔥 overlap fix
      speechSynthesis.speak(speech);

    } catch {
      console.log("Voice error");
    }
  };

  recognition.start();
  isListening = true;
}

// ⛔ STOP MIC (FIXED)
function stopMic() {
  if (recognition) {
    recognition.onresult = null;
    recognition.stop();
  }

  isListening = false;

  input.style.display = "block";
  sendBtn.style.display = "block";
  overlay.classList.add("hidden");

  speechSynthesis.cancel();

  micBtn.innerText = "🎤 Mic"; // ✅ FIX
}

// 🔘 BUTTONS
sendBtn.onclick = sendText;

micBtn.onclick = () => {
  if (!isListening) {
    startMic();
  } else {
    stopMic();
  }
};