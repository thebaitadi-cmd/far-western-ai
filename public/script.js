const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const chatBox = document.getElementById("chat-box");

let isVoiceInput = false;

// ✅ ADD MESSAGE
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ TEXT TO SPEECH (FREE - BROWSER)
function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);

  // 🔥 Better natural voice selection
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes("Google") || v.lang.includes("en"));

  if (preferredVoice) speech.voice = preferredVoice;

  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;

  speechSynthesis.speak(speech);
}

// ✅ SEND MESSAGE
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");

  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  // ✅ TEXT INPUT → TEXT OUTPUT
  if (!isVoiceInput) {
    addMessage(data.reply, "bot");
  }

  // ✅ VOICE INPUT → ONLY VOICE OUTPUT
  if (isVoiceInput) {
    speak(data.reply);
  }
}

// ✅ BUTTON CLICK
sendBtn.onclick = () => {
  isVoiceInput = false;
  sendMessage();
};

// ✅ ENTER PRESS
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    isVoiceInput = false;
    sendMessage();
  }
});

// ✅ VOICE INPUT (MIC)
micBtn.onclick = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-US";
  recognition.start();

  recognition.onstart = () => {
    console.log("🎤 Listening...");
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;

    input.value = text;
    isVoiceInput = true;

    sendMessage();
  };

  recognition.onerror = (err) => {
    console.log("Mic error:", err);
    alert("Mic not working!");
  };
};