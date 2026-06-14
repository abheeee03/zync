import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string") {
        return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    const farFuture = new Date("2099-01-01T00:00:00Z");

    await prisma.credential.upsert({
        where: {
            id: `gemini-${session.user.id}`,
        },
        create: {
            id: `gemini-${session.user.id}`,
            userId: session.user.id,
            name: "gemini",
            accessToken: apiKey,
            refreshToken: "",
            expiresAt: farFuture,
            scope: "gemini",
            updatedAt: new Date(),
        },
        update: {
            accessToken: apiKey,
            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ ok: true });
}
