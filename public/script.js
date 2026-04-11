const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

// ================= TEXT =================
async function sendMessage() {
  const input = document.getElementById("input");
  const msg = input.value;

  if (!msg) return;

  addMessage("👤", msg);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  addMessage("🤖", data.reply);

  input.value = "";
}

// ================= VOICE =================
function startVoice() {
  recognition.start();
}

recognition.onresult = async function (event) {
  const voiceText = event.results[0][0].transcript;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: voiceText })
  });

  const data = await res.json();

  speak(data.reply);
};

function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speechSynthesis.speak(speech);
}

// ================= IMAGE UPLOAD =================
async function uploadImage() {
  const fileInput = document.getElementById("imageInput");

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const res = await fetch("/api/image", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  addMessage("🤖", data.reply);
}

// ================= IMAGE GENERATE =================
async function generateImage() {
  const prompt = document.getElementById("input").value;

  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  const chat = document.getElementById("chat");

  const img = document.createElement("img");
  img.src = data.image;
  img.style.width = "200px";

  chat.appendChild(img);
}

// ================= UI =================
function addMessage(sender, text) {
  const chat = document.getElementById("chat");

  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}</b>: ${text}`;

  chat.appendChild(div);
}