const axios = require("axios");
const apiKeys = require("../config/apiKeys");

async function together(message) {
    try {
        const res = await axios.post(
            "https://api.together.xyz/v1/chat/completions",
            {
                model: "meta-llama/Meta-Llama-3-70B-Instruct-Turbo",
                messages: [
                    { role: "system", content: "You are Far-Western AI assistant." },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKeys.TOGETHER_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.data.choices[0].message.content;

    } catch (error) {
        console.log("❌ TOGETHER ERROR:", error.response?.data || error.message);
        return null;
    }
}

module.exports = together;