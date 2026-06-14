import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const VALID_PROVIDERS = ["gemini", "chatgpt", "claude"];

type LLMRouteContext = {
    params: Promise<{ provider: string }>;
};

export async function GET(
    _request: Request,
    { params }: LLMRouteContext
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider } = await params;
    const lowerProvider = provider.toLowerCase();
    if (!VALID_PROVIDERS.includes(lowerProvider)) {
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const credential = await prisma.credential.findUnique({
        where: { id: `${lowerProvider}-${session.user.id}` },
        select: { id: true, scope: true, createdAt: true },
    });

    const displayNames: Record<string, string> = {
        gemini: "Gemini API",
        chatgpt: "OpenAI API",
        claude: "Anthropic API"
    };

    return NextResponse.json({
        connected: !!credential,
        workspaceName: credential ? displayNames[lowerProvider] : null,
        connectedAt: credential?.createdAt ?? null,
    });
}

export async function POST(
    req: Request,
    { params }: LLMRouteContext
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider } = await params;
    const lowerProvider = provider.toLowerCase();
    if (!VALID_PROVIDERS.includes(lowerProvider)) {
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string") {
        return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    const farFuture = new Date("2099-01-01T00:00:00Z");

    await prisma.credential.upsert({
        where: {
            id: `${lowerProvider}-${session.user.id}`,
        },
        create: {
            id: `${lowerProvider}-${session.user.id}`,
            userId: session.user.id,
            name: lowerProvider,
            accessToken: apiKey,
            refreshToken: "",
            expiresAt: farFuture,
            scope: lowerProvider,
            updatedAt: new Date(),
        },
        update: {
            accessToken: apiKey,
            updatedAt: new Date(),
        },
    });

    return NextResponse.json({ ok: true });
}

export async function DELETE(
    _request: Request,
    { params }: LLMRouteContext
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider } = await params;
    const lowerProvider = provider.toLowerCase();
    if (!VALID_PROVIDERS.includes(lowerProvider)) {
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    await prisma.credential.deleteMany({
        where: { id: `${lowerProvider}-${session.user.id}`, userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
}
