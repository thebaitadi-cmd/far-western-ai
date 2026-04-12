let isVoiceMode = false;
let recognition;
let currentAudio = null;

/* ================= TEXT MODE ================= */
async function send() {
  if (isVoiceMode) return;

  const input = document.getElementById("input");
  const chatbox = document.getElementById("chatbox");

  const message = input.value.trim();
  if (!message) return;

  chatbox.innerHTML += `<div class="user">🧑 ${message}</div>`;
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({message})
    });

    const data = await res.json();

    chatbox.innerHTML += `<div class="bot">🤖 ${data.reply}</div>`;

    playAudio(data.audio);

    chatbox.scrollTop = chatbox.scrollHeight;

  } catch (e) {
    console.log("Error:", e);
  }
}


/* ================= VOICE MODE ================= */
function startVoice() {

  isVoiceMode = true;

  // 🎨 UI
  document.getElementById("chatbox").innerHTML = `
    <div class="voice-mode">
      <div class="orb"></div>
      <h2>🎤 Listening...</h2>
      <p>Far-Western AI Brain Active</p>
      <button onclick="stopVoice()">❌ Stop</button>
    </div>
  `;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = async function(event) {
    try {
      const text = event.results[event.results.length - 1][0].transcript;

      const res = await fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: text})
      });

      const data = await res.json();

      await playAudio(data.audio);

    } catch (e) {
      console.log("Voice error:", e);
    }
  };

  // 🔥 AUTO RESTART (important fix)
  recognition.onend = () => {
    if (isVoiceMode) {
      recognition.start();
    }
  };

  recognition.start();
}


/* ================= AUDIO PLAYER ================= */
async function playAudio(src) {
  try {
    if (!src) return;

    // 🔥 stop old audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(src + "?t=" + Date.now());
    currentAudio = audio;

    await audio.play();

  } catch (e) {
    console.log("Audio error:", e);
  }
}


/* ================= STOP VOICE ================= */
function stopVoice() {
  isVoiceMode = false;

  if (recognition) recognition.stop();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // UI reset
  document.getElementById("chatbox").innerHTML = "";
}