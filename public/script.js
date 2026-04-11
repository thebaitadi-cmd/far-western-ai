const API = "";

// CHAT
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value;

  const res = await fetch(API + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  alert(data.reply);
}

// IMAGE GENERATE
async function generateImage() {
  const prompt = document.getElementById("imgPrompt").value;

  const res = await fetch(API + "/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  document.getElementById("imgResult").src = data.image;
}

// IMAGE EDIT
async function editImage() {
  const file = document.getElementById("editFile").files[0];
  const prompt = document.getElementById("editPrompt").value;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("prompt", prompt);

  const res = await fetch(API + "/edit-image", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  document.getElementById("editResult").src = data.image;
}