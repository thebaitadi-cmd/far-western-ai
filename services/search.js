import axios from "axios";

export async function searchWeb(query) {
    try {
        const res = await axios.post("https://google.serper.dev/search",
            { q: query },
            {
                headers: {
                    "X-API-KEY": process.env.SERPER_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const results = res.data.organic || [];

        return results.slice(0, 5).map(item => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link
        }));

    } catch (error) {
        console.log("❌ SEARCH ERROR:", error.response?.data || error.message);
        return [];
    }
}