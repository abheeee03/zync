import { Json } from "@repo/shared/types";
import { executeWebhook } from "./webhook";

export const executeAction = async (actionName: string, metaData: Json) => {
    switch (actionName) {
        case "webhook": {
            if (!metaData || typeof metaData !== "object" || Array.isArray(metaData)) {
                throw new Error("webhook action requires metaData object");
            }

            const url = (metaData as { url?: unknown }).url;
            if (typeof url !== "string" || url.length === 0) {
                throw new Error("webhook action requires metaData.url string");
            }

            await executeWebhook(url);
            return;
        }
        default:
            throw new Error(`unsupported action: ${actionName}`);
    }
}