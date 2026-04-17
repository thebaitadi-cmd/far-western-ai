import axios from "axios";

export async function getWiki(query) {
    try {
        const res = await axios.get("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query));

        return {
            title: res.data.title,
            extract: res.data.extract,
            url: res.data.content_urls?.desktop?.page || ""
        };

    } catch (error) {
        console.log("❌ WIKI ERROR:", error.message);
        return null;
    }
}