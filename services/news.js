import axios from "axios";
import apiKeys from "../config/apiKeys.js";

export async function getNews(query) {
    try {
        const res = await axios.get("https://newsdata.io/api/1/news", {
            params: {
                apikey: apiKeys.NEWSDATA_KEY,
                q: query,
                language: "en"
            }
        });

        const articles = res.data.results;

        if (!articles || articles.length === 0) {
            return [];
        }

        return articles.slice(0, 3).map(item => ({
            title: item.title,
            description: item.description || "",
            link: item.link
        }));

    } catch (error) {
        console.log("❌ NEWS ERROR:", error.response?.data || error.message);
        return [];
    }
}