import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createWorkflowQueue } from "@repo/shared/queue"

type SavePayload = {
  isActive?: boolean
  trigger?: {
    triggerId: string
    metaData?: unknown
  } | null
  actions?: {
    actionId: string
    metaData?: unknown
    order?: number
  }[]
  nodes?: unknown[]
  edges?: unknown[]
}

type WorkflowRouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: Request,
  { params }: WorkflowRouteContext
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const id = (await params).id
  if (!id) {
    return NextResponse.json({ error: "Workflow id is required" }, { status: 400 })
  }

  const workflow = await prisma.workflows.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      trigger: {
        include: {
          availbleTriggers: true,
        },
      },
      actions: {
        include: {
          action: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  return NextResponse.json({
    name: workflow.name,
    isActive: workflow.isActive,
    nodes: workflow.nodes,
    edges: workflow.edges,
    trigger: workflow.trigger
      ? {
          id: workflow.trigger.id,
          triggerId: workflow.trigger.triggerId,
          name: workflow.trigger.availbleTriggers.name,
          metaData: workflow.trigger.metaData,
        }
      : null,
    actions: workflow.actions.map((action) => ({
      id: action.id,
      actionId: action.actionId,
      name: action.action.name,
      metaData: action.metaData,
      order: action.order,
    })),
  })
}

export async function POST(
  request: Request,
  { params }: WorkflowRouteContext
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const id = (await params).id
  if (!id) {
    return NextResponse.json({ error: "Workflow id is required" }, { status: 400 })
  }

  const payload = (await request.json()) as SavePayload

  const workflow = await prisma.workflows.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  const triggerData = payload?.trigger?.triggerId
    ? {
        triggerId: payload.trigger.triggerId,
        workflowId: id,
        userId: session.user.id,
        metaData: payload.trigger.metaData ?? {},
      }
    : null

  const actions = Array.isArray(payload?.actions) ? payload.actions : []
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const edges = Array.isArray(payload?.edges) ? payload.edges : []

  const isActive = payload.isActive;

  await prisma.$transaction(async (tx) => {
    await tx.workflows.update({
      where: {
        id,
      },
      data: {
        nodes: nodes as any,
        edges: edges as any,
        ...(isActive !== undefined && { isActive }),
      },
    })

    await tx.action.deleteMany({
      where: {
        workflowId: id,
      },
    })

    await tx.trigger.deleteMany({
      where: {
        workflowId: id,
      },
    })

    if (triggerData) {
      await tx.trigger.create({
        data: triggerData,
      })
    }

    for (const [index, action] of actions.entries()) {
      if (!action?.actionId) {
        continue
      }
      await tx.action.create({
        data: {
          actionId: action.actionId,
          workflowId: id,
          order: typeof action.order === "number" ? action.order : index,
          metaData: action.metaData ?? {},
        },
      })
    }
  })

  const updatedWorkflow = await prisma.workflows.findUnique({
    where: { id },
    include: {
      trigger: {
        include: {
          availbleTriggers: true
        }
      }
    }
  })

  const workflowQueue = createWorkflowQueue();
  if (workflowQueue) {
    const repeatableJobs = await workflowQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === id) {
        await workflowQueue.removeRepeatableByKey(job.key);
      }
    }

    if (updatedWorkflow?.isActive && updatedWorkflow?.trigger?.availbleTriggers.name.toLowerCase().includes("schedule")) {
      const cron = (updatedWorkflow.trigger.metaData as any)?.cron;
      if (cron) {
        await workflowQueue.add(id, { workflowId: id }, {
          repeat: { pattern: cron, immediately: true }
        });
      }
    }
  }

  return NextResponse.json({ ok: true })
  }

  export async function PATCH(
  request: Request,
  { params }: WorkflowRouteContext
  ) {
  const session = await auth.api.getSession({
  headers: await headers(),
  })

  if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const id = (await params).id
  if (!id) {
  return NextResponse.json({ error: "Workflow id is required" }, { status: 400 })
  }

  const { name } = await request.json()

  if (!name) {
  return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  try {
  const workflow = await prisma.workflows.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      name,
    },
  })
  return NextResponse.json(workflow)
  } catch (error) {
  console.error("Failed to update workflow name:", error)
  return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 })
  }
  }

  export async function DELETE(
    _request: Request,
    { params }: WorkflowRouteContext
  ) {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const id = (await params).id
    if (!id) {
      return NextResponse.json({ error: "Workflow id is required" }, { status: 400 })
    }

    try {
      await prisma.workflows.delete({
        where: {
          id,
          userId: session.user.id,
        },
      })

      const workflowQueue = createWorkflowQueue();
      if (workflowQueue) {
        const repeatableJobs = await workflowQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
          if (job.name === id) {
            await workflowQueue.removeRepeatableByKey(job.key);
          }
        }
      }

      return NextResponse.json({ ok: true })
    } catch (error) {
      console.error("Failed to delete workflow:", error)
      return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 })
    }
  }

