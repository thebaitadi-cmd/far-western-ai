async function send() {
  const input = document.getElementById("input").value;

  if (!input) return;

  document.getElementById("output").innerText = "Thinking...";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: input })
  });

  const data = await res.json();

  document.getElementById("output").innerText = "🤖 " + data.reply;
}