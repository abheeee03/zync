import { prisma } from "@repo/prisma/client"
import { executeAction } from "./actions";

export const ExecuteJob = async (runId: string) => {
    const data = await prisma.workflowRun.findUnique({
        where: {
            id: runId
        }, include: {
            workflow: {
                include: {
                    actions: {
                        orderBy: {
                            order: "asc"
                        },
                        include: {
                            action: true
                        }
                    },
                    trigger: true
                }
            }
        }
    })
    if(!data){
        throw new Error("workflow not found");
    }

    console.log("workflow found:", data, "\n\nworkflow data:", data.workflow);

    const actions = data.workflow.actions;
    let currentStep = data.current_step ?? 0;

    if (actions.length === 0) {
        await prisma.workflowRun.update({
            where: { id: runId },
            data: { status: "SUCCESS", current_step: 0 },
        });
        return;
    }

    if (currentStep < 0) {
        currentStep = 0;
    }

    if (currentStep >= actions.length) {
        await prisma.workflowRun.update({
            where: { id: runId },
            data: { status: "SUCCESS", current_step: actions.length },
        });
        return;
    }

    await prisma.workflowRun.update({
        where: { id: runId },
        data: { status: "RUNNING", current_step: currentStep },
    });

    const context: Record<string, string> = {};

    try {
        for (let i = currentStep; i < actions.length; i++) {
            const step = actions[i];
            
            // Interpolate dynamic variables (e.g. {data.message}) inside the step metadata using current context
            const interpolatedMetaData = interpolateMetaData(step.metaData, context);

            // Execute the action with the interpolated metadata
            const result = await executeAction(step.action.name, interpolatedMetaData, data.workflow.userId);
            
            // If this is an AI action, save the result to the context under "data.message"
            if (step.action.name.toLowerCase() === "ai" && result) {
                context["data.message"] = typeof result === "string" ? result : JSON.stringify(result);
            }

            await prisma.workflowRun.update({
                where: { id: runId },
                data: { current_step: i + 1 },
            });
        }

        await prisma.workflowRun.update({
            where: { id: runId },
            data: { status: "SUCCESS" },
        });
    } catch (e) {
        await prisma.workflowRun.update({
            where: { id: runId },
            data: { status: "FAILED" },
        });
        throw e;
    }
}

function interpolateMetaData(obj: any, context: Record<string, string>): any {
    if (typeof obj === "string") {
        let result = obj;
        for (const [key, val] of Object.entries(context)) {
            const placeholder = `{${key}}`;
            result = result.split(placeholder).join(val);
        }
        return result;
    } else if (Array.isArray(obj)) {
        return obj.map((item) => interpolateMetaData(item, context));
    } else if (obj !== null && typeof obj === "object") {
        const newObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            newObj[k] = interpolateMetaData(v, context);
        }
        return newObj;
    }
    return obj;
}