import axios from 'axios'

export const executeWebhook = async (url: string, method: string = 'POST', body: any = {}) => {
    if (!url) {
        throw new Error("webhook url is required");
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error(`invalid webhook url: ${url}`);
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error(`unsupported webhook protocol: ${parsedUrl.protocol}`);
    }

    const response = await axios({
        method: method,
        url: parsedUrl.toString(),
        data: body
    });
    console.log(response.data);
}