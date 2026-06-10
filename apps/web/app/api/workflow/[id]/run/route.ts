import { prisma } from "@repo/prisma/client"
import { createWorkflowQueue } from "@repo/shared/queue"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workflowId = (await params).id

  const workflow = await prisma.workflows.findFirst({
    where: {
      id: workflowId,
      userId: session.user.id,
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
    },
    select: {
      id: true,
    },
  })

  const workflowQueue = createWorkflowQueue()
  if (!workflowQueue) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }

  try {
    await workflowQueue.add("workflow-run", { runId: run.id }, { jobId: run.id })
    return NextResponse.json({ message: "Workflow started", runId: run.id })
  } catch (e) {
    console.error("Error starting workflow:", e)
    return NextResponse.json({ error: "Failed to start workflow" }, { status: 500 })
  }
}
