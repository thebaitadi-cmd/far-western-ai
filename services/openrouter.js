const axios = require("axios");
const apiKeys = require("../config/apiKeys");

async function openrouter(message) {
    try {
        const res = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3-70b-instruct",
                messages: [
                    { role: "system", content: "You are Far-Western AI assistant." },
                    { role: "user", content: message }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKeys.OPENROUTER_KEYS}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.data.choices[0].message.content;

    } catch (error) {
        console.log("❌ OPENROUTER ERROR:", error.response?.data || error.message);
        return null;
    }
}

module.exports = openrouter;