import { auth } from "@/lib/auth";
import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.redirect(new URL("/login", req.url));

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code) {
        return NextResponse.redirect(new URL("/credentials?notion=error", req.url));
    }

    // Optional: validate state matches userId
    if (state && state !== session.user.id) {
        return NextResponse.redirect(new URL("/credentials?notion=error", req.url));
    }

    const clientId = process.env.NOTION_CLIENT_ID!;
    const clientSecret = process.env.NOTION_CLIENT_SECRET!;
    const redirectUri = process.env.NOTION_REDIRECT_URI ?? "http://localhost:3000/api/notion/callback";

    // Exchange code for access token
    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!tokenRes.ok) {
        console.error("Notion token exchange failed", await tokenRes.text());
        return NextResponse.redirect(new URL("/credentials?notion=error", req.url));
    }

    const tokenData = (await tokenRes.json()) as {
        access_token: string;
        workspace_name?: string;
        workspace_id?: string;
        bot_id?: string;
        token_type: string;
    };

    // Notion tokens don't expire — store far-future date
    const farFuture = new Date("2099-01-01T00:00:00Z");

    // Upsert credential — name = "notion" acts as the provider key
    await prisma.credential.upsert({
        where: {
            // Use a compound-ish lookup by finding existing record
            id: `notion-${session.user.id}`,
        },
        create: {
            id: `notion-${session.user.id}`,
            userId: session.user.id,
            name: "notion",
            accessToken: tokenData.access_token,
            refreshToken: "", // Notion has no refresh token
            expiresAt: farFuture,
            scope: tokenData.workspace_name ?? "notion",
            updatedAt: new Date(),
        },
        update: {
            accessToken: tokenData.access_token,
            scope: tokenData.workspace_name ?? "notion",
            updatedAt: new Date(),
        },
    });

    return NextResponse.redirect(new URL("/credentials?notion=connected", req.url));
}
