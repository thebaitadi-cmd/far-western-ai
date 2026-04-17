const axios = require("axios");
const apiKeys = require("../config/apiKeys");

async function gemini(message) {
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.GEMINI_KEY}`,
            {
                contents: [
                    {
                        parts: [{ text: message }]
                    }
                ]
            }
        );

        return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";

    } catch (error) {
        console.log("❌ GEMINI ERROR:", error.response?.data || error.message);
        return null;
    }
}

module.exports = gemini;