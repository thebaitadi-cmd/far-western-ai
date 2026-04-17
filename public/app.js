const input = document.getElementById("msg");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const overlay = document.getElementById("voiceOverlay");

let recognition = null;
let isListening = false;
let isSpeaking = false;
let isStarting = false; // 🔥 NEW FIX

// 🧠 UNIQUE USER ID
let userId = localStorage.getItem("fw_user");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("fw_user", userId);
}

const API_URL = "https://ai.thebaitadi.com";

// 🧠 UI MESSAGE
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
        "x-user-id": userId
      },
      body: JSON.stringify({ msg })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");

  } catch {
    addMessage("⚠️ Server not responding", "bot");
  }
}

// 🎤 SAFE START
function safeStart() {
  if (!recognition || isListening || isStarting) return;

  try {
    isStarting = true;
    recognition.start();
  } catch (e) {
    console.log("Start blocked:", e);
  }
}

// 🎤 START MIC
function startMic() {
  if (isListening) return;

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.lang = "en-US";

  input.style.display = "none";
  sendBtn.style.display = "none";
  overlay.classList.remove("hidden");

  micBtn.innerText = "🛑 Stop";

  recognition.onstart = () => {
    isListening = true;
    isStarting = false;
  };

  recognition.onend = () => {
    isListening = false;

    // 🔁 SAFE RESTART
    if (!isSpeaking) {
      setTimeout(() => safeStart(), 600);
    }
  };

  recognition.onerror = (e) => {
    console.log("Speech error:", e.error);
    isListening = false;
    isStarting = false;
  };

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

      const data = await res.json();

      recognition.stop();
      isSpeaking = true;

      const speech = new SpeechSynthesisUtterance(data.reply);

      speech.onend = () => {
        isSpeaking = false;

        // 🔥 FIX: delay restart
        setTimeout(() => {
          if (!isListening) safeStart();
        }, 700);
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(speech);

    } catch {
      console.log("Voice error");
    }
  };

  safeStart();
}

// ⛔ STOP MIC
function stopMic() {
  if (recognition) {
    recognition.onresult = null;
    recognition.stop();
  }

  isListening = false;
  isStarting = false;

  input.style.display = "block";
  sendBtn.style.display = "block";
  overlay.classList.add("hidden");

  speechSynthesis.cancel();

  micBtn.innerText = "🎤 Mic";
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