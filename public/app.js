const input = document.getElementById("msg");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const overlay = document.getElementById("voiceOverlay");

let recognition;
let isListening = false;
let isSpeaking = false;

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
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");

  } catch (err) {
    addMessage("⚠️ Error", "bot");
  }
}

// 🎤 START MIC (CLEAN UI - NO ANIMATION)
function startMic() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.continuous = true;
  recognition.lang = "en-US";

  // UI MODE
  input.style.display = "none";
  sendBtn.style.display = "none";
  overlay.classList.remove("hidden");

  recognition.onresult = async (event) => {
    if (isSpeaking) return;

    const text = event.results[event.results.length - 1][0].transcript;

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ msg: text })
      });

      const data = await res.json();

      recognition.stop();
      isSpeaking = true;

      const audio = new Audio(`/voice?text=${encodeURIComponent(data.reply)}`);

      audio.onended = () => {
        isSpeaking = false;
        recognition.start();
      };

      audio.play();

    } catch (err) {
      console.log("Voice error");
    }
  };

  recognition.start();
  isListening = true;
}

// ⛔ STOP MIC
function stopMic() {
  if (recognition) recognition.stop();

  isListening = false;

  // UI RESET
  input.style.display = "block";
  sendBtn.style.display = "block";
  overlay.classList.add("hidden");
}

// 🔘 BUTTONS
sendBtn.onclick = sendText;

micBtn.onclick = () => {
  if (!isListening) {
    startMic();
    micBtn.innerText = "🛑 Stop";
  } else {
    stopMic();
    micBtn.innerText = "🎤 Mic";
  }
};