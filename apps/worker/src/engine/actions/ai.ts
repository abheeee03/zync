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
        const credential = await prisma.credential.findFirst({
            where: {
                userId,
                name: "chatgpt"
            }
        });

        if (!credential) {
            throw new Error("ChatGPT credential not found. Please connect ChatGPT first.");
        }

        const apiKey = credential.accessToken;

        // Native fetch call to OpenAI API
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const result = (await response.json()) as any;
        const outputText = result?.choices?.[0]?.message?.content;

        if (!outputText) {
            throw new Error(`OpenAI returned an empty response: ${JSON.stringify(result)}`);
        }

        return outputText;
    } else if (provider === "claude") {
        const credential = await prisma.credential.findFirst({
            where: {
                userId,
                name: "claude"
            }
        });

        if (!credential) {
            throw new Error("Claude credential not found. Please connect Claude first.");
        }

        const apiKey = credential.accessToken;

        // Native fetch call to Anthropic API
        const response = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 4096,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }

        const result = (await response.json()) as any;
        const outputText = result?.content?.[0]?.text;

        if (!outputText) {
            throw new Error(`Anthropic returned an empty response: ${JSON.stringify(result)}`);
        }

        return outputText;
    } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
};
