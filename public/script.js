async function send() {
  const input = document.getElementById("input").value;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: input })
  });

  const data = await res.json();

  document.getElementById("output").innerText = data.reply;
}

// 🎤 VOICE INPUT
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.onresult = async function(event) {
    const text = event.results[0][0].transcript;

    // ❌ DON'T SHOW TEXT
    document.getElementById("output").innerText = "";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    // 🔊 VOICE OUTPUT ONLY
    const speech = new SpeechSynthesisUtterance(data.reply);
    speechSynthesis.speak(speech);
  };

  recognition.start();
}