async function send() {
  let input = document.getElementById("input").value;

  document.getElementById("chat").innerHTML += `<p>👤 ${input}</p>`;

  let res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: input })
  });

  let data = await res.json();

  document.getElementById("chat").innerHTML += `<p>🤖 ${data.reply}</p>`;
}

async function img() {
  let input = document.getElementById("input").value;

  let res = await fetch("/image", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ prompt: input })
  });

  let data = await res.json();

  document.getElementById("chat").innerHTML += `<img src="${data.image}" width="300"/>`;
}