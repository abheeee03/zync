import axios from "axios";
import { prisma } from "@repo/prisma/client";

const NOTION_VERSION = "2022-06-28";

export const executeNotionAction = async (metaData: any, userId: string) => {
    const actionType = typeof metaData.actionType === "string" ? metaData.actionType : "create_page";
    const databaseId = typeof metaData.databaseId === "string" ? metaData.databaseId : "";
    const targetPageId = typeof metaData.targetPageId === "string" ? metaData.targetPageId : "";
    const blockContent = typeof metaData.blockContent === "string" ? metaData.blockContent : "";
    const filterProperty = typeof metaData.filterProperty === "string" ? metaData.filterProperty : "";
    const filterValue = typeof metaData.filterValue === "string" ? metaData.filterValue : "";
    const fieldValues = (metaData.fieldValues as Record<string, unknown>) ?? {};

    if (!databaseId) {
        throw new Error("databaseId is required for Notion action");
    }

    const credential = await prisma.credential.findUnique({
        where: { id: `notion-${userId}` },
    });

    if (!credential) {
        throw new Error(`Notion credential not found for user: ${userId}`);
    }

    const headers = {
        Authorization: `Bearer ${credential.accessToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    };

    if (actionType === "create_page" || actionType === "update_page") {
        const schemaRes = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, { headers });
        const schemaProperties = schemaRes.data.properties;

        const builtProperties: Record<string, any> = {};

        for (const [name, value] of Object.entries(fieldValues)) {
            const propInfo = schemaProperties[name];
            if (!propInfo) continue;

            const type = propInfo.type;
            if (value === undefined || value === null || value === "") continue;

            switch (type) {
                case "title":
                    builtProperties[name] = { title: [{ text: { content: String(value) } }] };
                    break;
                case "rich_text":
                    builtProperties[name] = { rich_text: [{ text: { content: String(value) } }] };
                    break;
                case "number":
                    builtProperties[name] = { number: Number(value) };
                    break;
                case "select":
                    builtProperties[name] = { select: { name: String(value) } };
                    break;
                case "status":
                    builtProperties[name] = { status: { name: String(value) } };
                    break;
                case "multi_select":
                    if (Array.isArray(value)) {
                        builtProperties[name] = { multi_select: value.map((v) => ({ name: String(v) })) };
                    }
                    break;
                case "checkbox":
                    builtProperties[name] = { checkbox: Boolean(value) };
                    break;
                case "date":
                    builtProperties[name] = { date: { start: String(value) } };
                    break;
                case "url":
                    builtProperties[name] = { url: String(value) };
                    break;
                case "email":
                    builtProperties[name] = { email: String(value) };
                    break;
                case "phone_number":
                    builtProperties[name] = { phone_number: String(value) };
                    break;
            }
        }

        if (actionType === "create_page") {
            const response = await axios.post(
                "https://api.notion.com/v1/pages",
                {
                    parent: { database_id: databaseId },
                    properties: builtProperties,
                },
                { headers }
            );
            console.log("Notion page created:", response.data.id);
        } else {
            if (!targetPageId) {
                throw new Error("targetPageId is required for update_page Notion action");
            }
            const response = await axios.patch(
                `https://api.notion.com/v1/pages/${targetPageId}`,
                {
                    properties: builtProperties,
                },
                { headers }
            );
            console.log("Notion page updated:", response.data.id);
        }
    } else if (actionType === "append_block") {
        if (!targetPageId) {
            throw new Error("targetPageId is required for append_block Notion action");
        }
        const response = await axios.patch(
            `https://api.notion.com/v1/blocks/${targetPageId}/children`,
            {
                children: [
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: blockContent,
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
            { headers }
        );
        console.log("Notion block appended to page:", targetPageId);
    } else if (actionType === "query_database") {
        const queryBody: any = {};
        if (filterProperty && filterValue) {
            const schemaRes = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, { headers });
            const propInfo = schemaRes.data.properties[filterProperty];
            if (propInfo) {
                const type = propInfo.type;
                let filterObj: any = null;
                switch (type) {
                    case "title":
                        filterObj = { title: { equals: String(filterValue) } };
                        break;
                    case "rich_text":
                        filterObj = { rich_text: { equals: String(filterValue) } };
                        break;
                    case "select":
                        filterObj = { select: { equals: String(filterValue) } };
                        break;
                    case "status":
                        filterObj = { status: { equals: String(filterValue) } };
                        break;
                    case "checkbox":
                        filterObj = { checkbox: { equals: filterValue === "true" || filterValue === true } };
                        break;
                }
                if (filterObj) {
                    queryBody.filter = {
                        property: filterProperty,
                        ...filterObj,
                    };
                }
            }
        }
        const response = await axios.post(
            `https://api.notion.com/v1/databases/${databaseId}/query`,
            queryBody,
            { headers }
        );
        console.log(`Notion database queried: ${databaseId}, results:`, response.data.results?.length);
    } else {
        throw new Error(`unsupported actionType: ${actionType}`);
    }
};
