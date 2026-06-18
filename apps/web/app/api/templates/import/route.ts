import { auth } from "@/lib/auth"
import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

type ImportPayload = {
  name: string
  triggerName: string
  actionNames: string[]
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as ImportPayload
  const { name, triggerName, actionNames } = body

  if (!name || !triggerName || !Array.isArray(actionNames) || actionNames.length === 0) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 })
  }

  // Look up trigger by name (case-insensitive contains)
  const allTriggers = await prisma.availableTriggers.findMany()
  const trigger = allTriggers.find((t) =>
    t.name.toLowerCase().includes(triggerName.toLowerCase())
  )

  if (!trigger) {
    return NextResponse.json(
      { error: `Trigger not found: "${triggerName}"` },
      { status: 404 }
    )
  }
  const allActions = await prisma.availableActions.findMany()
  const resolvedActions: { actionId: string; order: number }[] = []

  for (let i = 0; i < actionNames.length; i++) {
    const actionName = actionNames[i]
    const action = allActions.find((a) =>
      a.name.toLowerCase().includes(actionName.toLowerCase())
    )
    if (!action) {
      return NextResponse.json(
        { error: `Action not found: "${actionName}"` },
        { status: 404 }
      )
    }
    resolvedActions.push({ actionId: action.id, order: i })
  }

  const workflow = await prisma.workflows.create({
    data: {
      name,
      userId: session.user.id,
      trigger: {
        create: {
          triggerId: trigger.id,
          userId: session.user.id,
        },
      },
      actions: {
        create: resolvedActions.map((a) => ({
          actionId: a.actionId,
          order: a.order,
        })),
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ workflowId: workflow.id })
}
