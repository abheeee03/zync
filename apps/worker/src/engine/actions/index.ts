import { Json } from "@repo/shared/types";
import { executeWebhook } from "./webhook";
import { executeNotionAction } from "./notion";
import { executeAiAction } from "./ai";
import { executeDelayAction } from "./delay";
import { executeTransformAction } from "./transform";
import { executeGithubAction } from "./github";

export const executeAction = async (actionName: string, metaData: Json, userId: string) => {
    switch (actionName.toLowerCase()) {
        case "delay":
        case "delay action": {
            return await executeDelayAction(metaData);
        }
        case "transform":
        case "transform action": {
            return await executeTransformAction(metaData);
        }
        case "ai":
        case "ai action": {
            return await executeAiAction(metaData, userId);
        }
        case "notion":
        case "notion action": {
            await executeNotionAction(metaData, userId);
            return;
        }
        case "github":
        case "github action":
        case "create_issue":
        case "create_comment":
        case "create_pr":
        case "create_branch":
        case "get_repo": {
            return await executeGithubAction(actionName, metaData, userId);
        }
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