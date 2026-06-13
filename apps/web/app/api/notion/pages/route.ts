import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const databaseId = req.nextUrl.searchParams.get("databaseId");
    if (!databaseId) return NextResponse.json({ error: "databaseId query param required" }, { status: 400 });

    const credential = await prisma.credential.findUnique({
        where: { id: `notion-${session.user.id}` },
    });

    if (!credential) {
        return NextResponse.json({ error: "Notion not connected" }, { status: 403 });
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${credential.accessToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 50 }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Notion pages query failed:", err);
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 502 });
    }

    const data = (await res.json()) as {
        results: Array<{
            id: string;
            properties: Record<string, {
                type: string;
                title?: Array<{ plain_text?: string }>;
                rich_text?: Array<{ plain_text?: string }>;
            }>;
        }>;
    };

    const pages = data.results.map((page) => {
        // Try to find a title property
        const titleProp = Object.values(page.properties).find((p) => p.type === "title");
        const title = titleProp?.title?.[0]?.plain_text ?? "Untitled";
        return { id: page.id, title };
    });

    return NextResponse.json({ pages });
}
