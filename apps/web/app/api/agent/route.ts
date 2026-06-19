import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { OpenRouter, tool } from "@openrouter/agent";
import { z } from "zod";
import { prisma } from "@repo/prisma/client";

const PRIMARY_MODEL = process.env.PRIMARY_MODEL;
const FALLBACK_MODEL = process.env.FALLBACK_MODEL;

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const [availableActions, availableTriggers] = await Promise.all([
        prisma.availableActions.findMany(),
        prisma.availableTriggers.findMany(),
    ]);

    const actionsContext = availableActions
        .map((a) => `- id: "${a.id}", name: "${a.name}"`)
        .join("\n");

    const triggersContext = availableTriggers
        .map((t) => `- id: "${t.id}", name: "${t.name}"`)
        .join("\n");

    let createdWorkflowId: string | null = null;
    let isOutOfScope = false;
    let outOfScopeReason = "";

    const reportOutOfScopeTool = tool({
        name: "report_out_of_scope",
        description:
            "Call this tool if the user's request is out of scope and cannot be created using the available triggers and actions. For example, if it requires integrations or steps that Zync does not currently support.",
        inputSchema: z.object({
            reason: z
                .string()
                .describe(
                    "A brief, clear explanation of why this request is out of scope (e.g. 'Zync does not currently support Discord integrations')."
                ),
        }),
        execute: async ({ reason }) => {
            isOutOfScope = true;
            outOfScopeReason = reason;
            return {
                success: true,
                message: "Out of scope reported successfully.",
            };
        },
    });

    const createWorkflowTool = tool({
        name: "create_workflow",
        description:
            "Creates a new automation workflow with a trigger and one or more ordered actions based on the user's request. Always call this tool once you have determined the best trigger and actions.",
        inputSchema: z.object({
            name: z
                .string()
                .describe(
                    "A short, descriptive name for the workflow (e.g. 'GitHub Issue → Notion')"
                ),
            triggerId: z
                .string()
                .describe("The id of the AvailableTrigger to use for this workflow"),
            actions: z
                .array(
                    z.object({
                        actionId: z
                            .string()
                            .describe("The id of the AvailableAction to use"),
                        order: z
                            .number()
                            .int()
                            .describe("Zero-based position of this action in the sequence"),
                    })
                )
                .min(1)
                .describe("Ordered list of actions to execute in this workflow"),
        }),
        execute: async ({ name, triggerId, actions }) => {
            const validTrigger = availableTriggers.find((t) => t.id === triggerId);
            if (!validTrigger) {
                return {
                    success: false,
                    error: `Invalid triggerId: "${triggerId}". Choose from the provided list.`,
                };
            }

            for (const action of actions) {
                const validAction = availableActions.find(
                    (a) => a.id === action.actionId
                );
                if (!validAction) {
                    return {
                        success: false,
                        error: `Invalid actionId: "${action.actionId}". Choose from the provided list.`,
                    };
                }
            }

            const workflow = await prisma.workflows.create({
                data: {
                    name,
                    userId: session.user.id,
                    trigger: {
                        create: {
                            triggerId,
                            userId: session.user.id,
                        },
                    },
                    actions: {
                        create: actions.map((a) => ({
                            actionId: a.actionId,
                            order: a.order,
                        })),
                    },
                },
                select: { id: true },
            });

            createdWorkflowId = workflow.id;

            return {
                success: true,
                workflowId: workflow.id,
                message: `Workflow "${name}" created successfully.`,
            };
        },
    });

    const systemPrompt = `You are an expert workflow automation assistant for Zync, an automation platform similar to Zapier.

Your job is to analyze the user's request and create the most appropriate workflow using the available triggers and actions.

## Available Triggers
${triggersContext}

## Available Actions
${actionsContext}

## Instructions
1. Analyze the user's automation request carefully.
2. Choose the most appropriate trigger from the available triggers list.
3. Choose one or more actions (in order) from the available actions list.
4. Call the \`create_workflow\` tool EXACTLY ONCE with your selections.
5. Use the exact ids from the lists above — do not make up new ids.
6. Give the workflow a concise, descriptive name.
7. If the request is out of scope and cannot be achieved using the available triggers and actions, call the \`report_out_of_scope\` tool to explain what is missing. Do not call \`create_workflow\` if the request is unsupported.

Trigger meanings:
- "manual": workflow is triggered manually by the user
- "webhook": workflow is triggered by an incoming HTTP webhook
- "schedule": workflow runs on a recurring schedule (cron)

Action meanings:
- "webhook": send an HTTP request to an external service
- "notion": create or update a Notion page/database entry
- "ai": use an AI model to process/generate content
- "delay": wait for a specified amount of time
- "transform": transform/map data between steps`;

    const openrouter = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const tryCallModel = async (model: string) => {
        return openrouter.callModel({
            model,
            input: prompt,
            tools: [createWorkflowTool, reportOutOfScopeTool],
            instructions: systemPrompt,
        });
    };

    try {
        let result;
        try {
            result = await tryCallModel(PRIMARY_MODEL!);
            await result.getText();
        } catch (primaryError) {
            console.warn(
                `Primary model (${PRIMARY_MODEL}) failed, falling back to ${FALLBACK_MODEL}:`,
                primaryError
            );
            createdWorkflowId = null;
            isOutOfScope = false;
            outOfScopeReason = "";
            result = await tryCallModel(FALLBACK_MODEL!);
            await result.getText();
        }

        if (isOutOfScope) {
            return NextResponse.json(
                {
                    error: "This workflow can't be created. Contact support for more.",
                    reason: outOfScopeReason,
                    code: "OUT_OF_SCOPE",
                },
                { status: 422 }
            );
        }

        if (!createdWorkflowId) {
            return NextResponse.json(
                {
                    error: "This workflow can't be created. Contact support for more.",
                    code: "OUT_OF_SCOPE",
                },
                { status: 422 }
            );
        }

        return NextResponse.json({ workflowId: createdWorkflowId });
    } catch (error: unknown) {
        console.error("Agent error:", error);
        const message =
            error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
