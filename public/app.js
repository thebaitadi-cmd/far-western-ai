const input = document.querySelector("input");
const chatBox = document.querySelector(".chat-box");
const sendBtn = document.querySelector(".send-btn"); // ⚠️ important

function addMessage(text, user = false) {
  const div = document.createElement("div");
  div.className = user ? "user" : "bot";
  div.innerText = text;
  chatBox.appendChild(div);
}

// ✅ SEND MESSAGE FUNCTION
async function sendMessage(text) {
  if (!text.trim()) return;

  addMessage(text, true);
  input.value = "";

  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  addMessage(data.reply);

  speak(data.reply);
}

// ✅ BUTTON CLICK FIX
sendBtn.addEventListener("click", () => {
  sendMessage(input.value);
});

// ✅ ENTER KEY FIX
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage(input.value);
  }
});

// ✅ VOICE
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "hi-IN";

function startListening() {
  addMessage("🎤 Listening...");
  recognition.start();
}

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  sendMessage(text);
};

// ✅ SPEAK
function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();

  let selected =
    voices.find(v => v.lang.includes("hi")) ||
    voices.find(v => v.lang.includes("en"));

  speech.voice = selected;
  speech.lang = selected.lang;

  speechSynthesis.speak(speech);
}