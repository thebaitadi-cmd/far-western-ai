async function sendMessage() {
  const input = document.getElementById("input");
  const msg = input.value;

  if (!msg) return;

  addMessage("👤", msg);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  addMessage("🤖", data.reply);

  input.value = "";
}

function addMessage(sender, text) {
  const chat = document.getElementById("chat");

  const div = document.createElement("div");
  div.innerHTML = `<b>${sender}</b>: ${text}`;

  chat.appendChild(div);
}