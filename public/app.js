async function send() {
  const input = document.getElementById("input");
  const text = input.value;
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  const res = await fetch("/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();

  addMsg(data.reply, "bot");
}

function addMsg(text, type) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}