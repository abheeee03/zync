import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: databaseId } = await params;

    const credential = await prisma.credential.findUnique({
        where: { id: `notion-${session.user.id}` },
    });

    if (!credential) {
        return NextResponse.json({ error: "Notion not connected" }, { status: 403 });
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        headers: {
            Authorization: `Bearer ${credential.accessToken}`,
            "Notion-Version": NOTION_VERSION,
        },
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Notion DB schema fetch failed:", err);
        return NextResponse.json({ error: "Failed to fetch database schema" }, { status: 502 });
    }

    const data = (await res.json()) as {
        id: string;
        title?: Array<{ plain_text?: string }>;
        properties: Record<string, NotionProperty>;
    };

    // Normalize properties into a simpler shape for the UI
    const properties = Object.entries(data.properties).map(([name, prop]) => {
        const base = { name, id: prop.id, type: prop.type };

        switch (prop.type) {
            case "select":
                return { ...base, options: (prop.select?.options ?? []).map((o: { name: string; color?: string }) => ({ name: o.name, color: o.color })) };
            case "multi_select":
                return { ...base, options: (prop.multi_select?.options ?? []).map((o: { name: string; color?: string }) => ({ name: o.name, color: o.color })) };
            case "status":
                return { ...base, options: (prop.status?.options ?? []).map((o: { name: string; color?: string }) => ({ name: o.name, color: o.color })) };
            default:
                return base;
        }
    });

    return NextResponse.json({
        id: data.id,
        title: data.title?.[0]?.plain_text ?? "Untitled",
        properties,
    });
}

// ---- types ----
type NotionProperty = {
    id: string;
    type: string;
    select?: { options: Array<{ name: string; color?: string }> };
    multi_select?: { options: Array<{ name: string; color?: string }> };
    status?: { options: Array<{ name: string; color?: string }> };
};
