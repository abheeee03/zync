import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workflows = await prisma.workflows.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json(workflows)
}
