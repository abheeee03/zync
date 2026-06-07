import { Json } from "@repo/shared/types";
import { executeWebhook } from "./webhook";

export const executeAction = async (actionName: string, metaData: Json) => {
    switch (actionName.toLowerCase()) {
        case "webhook":
        case "http request": {
            if (!metaData || typeof metaData !== "object" || Array.isArray(metaData)) {
                throw new Error(`${actionName} action requires metaData object`);
            }

            const url = (metaData as { url?: unknown }).url;
            const method = (metaData as { method?: unknown }).method;
            const body = (metaData as { body?: unknown }).body;

            if (typeof url !== "string" || url.length === 0) {
                throw new Error(`${actionName} action requires metaData.url string`);
            }

            let parsedBody = body;
            if (typeof body === "string") {
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    // if it's not valid JSON, just pass it as is or handle it
                }
            }

            await executeWebhook(
                url, 
                typeof method === "string" ? method : "POST", 
                parsedBody
            );
            return;
        }
        default:
            throw new Error(`unsupported action: ${actionName}`);
    }
}