const axios = require("axios");
const apiKeys = require("../config/apiKeys");

async function callGroq(message) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are Far-Western AI assistant. Be helpful, clear and smart."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${apiKeys.GROQ_KEYS}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data?.choices?.[0]?.message?.content || null;

  } catch (error) {
    console.log("❌ GROQ ERROR:", error.response?.data || error.message);
    return null; // IMPORTANT: fallback will handle it
  }
}

// IMPORTANT EXPORT (MATCHS aiRouter IMPORT)
module.exports = { callGroq };