import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

type SavePayload = {
  trigger?: {
    triggerId: string
    metaData?: unknown
  } | null
  actions?: {
    actionId: string
    metaData?: unknown
    order?: number
  }[]
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let id = (await params).id
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
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let id = (await params).id
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

  await prisma.$transaction(async (tx) => {
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

  return NextResponse.json({ ok: true })
}
