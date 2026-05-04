import { prisma } from "@repo/prisma/client";
import { createWorkflowQueue } from "@repo/shared/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, ctx: {
    params: Promise<{
        userId: string;
        workflowId: string;
    }>;
}) {
    const { userId, workflowId } = await ctx.params;
    console.log("starting using: ", workflowId, "and ", userId);
    
    const isValidWorkflow = await prisma.workflows.findFirst({
        where: {
            id: workflowId,
            userId
        }
    })

    if (!isValidWorkflow) {
        return NextResponse.json({
            message: "Workflow not found."
        }, { status: 404 })
    }

    const data = await prisma.workflowRun.create({
        data: {
            workflowId
        }, select: {
            id: true
        }
    })

    if (!data) {
        return NextResponse.json({
            message: "Something went wrong"
        }, { status: 500 })
    }

    const workflowQueue = createWorkflowQueue();
    if (!workflowQueue) {
        return NextResponse.json({
            message: "Internal Server Error"
        }, { status: 500 })
    }

    try {
        await workflowQueue.add("workflow-run", { runId: data.id }, { jobId: data.id })
        return NextResponse.json({
            message: "successfully started the workflow"
        })
    } catch (e) {
        console.log("error while saving to redis: ", e);
        return NextResponse.json({
            message: "Internal Server error"
        }, { status: 500 })
    }
}