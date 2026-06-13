import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credential = await prisma.credential.findUnique({
        where: { id: `notion-${session.user.id}` },
    });

    if (!credential) {
        return NextResponse.json({ error: "Notion not connected" }, { status: 403 });
    }

    // Search for all databases accessible to the integration
    let allDatabases: unknown[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
        const body: Record<string, unknown> = {
            filter: { property: "object", value: "database" },
            page_size: 100,
        };
        if (startCursor) body.start_cursor = startCursor;

        const res = await fetch("https://api.notion.com/v1/search", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${credential.accessToken}`,
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Notion search failed:", err);
            return NextResponse.json({ error: "Failed to fetch databases from Notion" }, { status: 502 });
        }

        const data = (await res.json()) as { results: unknown[]; has_more: boolean; next_cursor?: string };
        allDatabases = [...allDatabases, ...data.results];
        hasMore = data.has_more;
        startCursor = data.next_cursor;
    }

    // Shape the response — only what the UI needs
    const databases = (allDatabases as Array<{
        id: string;
        title?: Array<{ plain_text?: string }>;
        icon?: { type: string; emoji?: string };
        url?: string;
    }>).map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text ?? "Untitled",
        icon: db.icon?.emoji ?? null,
        url: db.url,
    }));

    return NextResponse.json({ databases });
}
