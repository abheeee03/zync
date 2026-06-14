import { prisma } from "@repo/prisma/client";

export const executeAiAction = async (metaData: any, userId: string): Promise<string> => {
    const provider = typeof metaData.provider === "string" ? metaData.provider.toLowerCase() : "gemini";
    const model = typeof metaData.model === "string" ? metaData.model : "gemini-1.5-flash";
    const prompt = typeof metaData.prompt === "string" ? metaData.prompt : "";

    if (!prompt) {
        throw new Error("Prompt is required for AI action");
    }

    if (provider === "gemini") {
        const credential = await prisma.credential.findFirst({
            where: {
                userId,
                name: "gemini"
            }
        });

        if (!credential) {
            throw new Error("Gemini credential not found. Please connect Gemini first.");
        }

        const apiKey = credential.accessToken;
        
        // Native fetch call to Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = (await response.json()) as any;
        const outputText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!outputText) {
            throw new Error(`Gemini returned an empty response: ${JSON.stringify(result)}`);
        }

        return outputText;
    } else if (provider === "chatgpt") {
        // Scalability: Add OpenAI ChatGPT handler here later
        throw new Error("ChatGPT integration is not supported yet.");
    } else if (provider === "claude") {
        // Scalability: Add Anthropic Claude handler here later
        throw new Error("Claude integration is not supported yet.");
    } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
};
