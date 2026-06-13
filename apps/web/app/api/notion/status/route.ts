import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credential = await prisma.credential.findUnique({
        where: { id: `notion-${session.user.id}` },
        select: { id: true, scope: true, createdAt: true },
    });

    return NextResponse.json({
        connected: !!credential,
        workspaceName: credential?.scope ?? null,
        connectedAt: credential?.createdAt ?? null,
    });
}

export async function DELETE() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.credential.deleteMany({
        where: { id: `notion-${session.user.id}`, userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
}
