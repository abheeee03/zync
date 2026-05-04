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

    try {
        for (let i = currentStep; i < actions.length; i++) {
            const step = actions[i];
            await executeAction(step.action.name, step.metaData);
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