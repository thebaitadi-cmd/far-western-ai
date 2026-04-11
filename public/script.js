async function send() {
  const msg = document.getElementById("msg").value;

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg }),
  });

  const data = await res.json();
  document.getElementById("output").innerText = data.reply;
}

// 🎤 VOICE
function voice() {
  const rec = new webkitSpeechRecognition();
  rec.start();

  rec.onresult = async (e) => {
    const text = e.results[0][0].transcript;

    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    const speech = new SpeechSynthesisUtterance(data.reply);
    speechSynthesis.speak(speech);
  };
}

// 📷 IMAGE UPLOAD
async function upload() {
  const file = document.getElementById("img").files[0];
  const form = new FormData();
  form.append("image", file);

  const res = await fetch("/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  document.getElementById("output").innerText = data.reply;
}

// 🎨 GENERATE IMAGE
async function generate() {
  const prompt = document.getElementById("prompt").value;

  const res = await fetch("/generate-image", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  document.getElementById("genImg").src = data.image;
}

// 🛠️ EDIT IMAGE
async function edit() {
  const file = document.getElementById("editImg").files[0];
  const prompt = document.getElementById("editPrompt").value;

  const form = new FormData();
  form.append("image", file);
  form.append("prompt", prompt);

  const res = await fetch("/edit-image", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  document.getElementById("editOut").src = data.image;
}