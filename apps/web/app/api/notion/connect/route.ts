import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI ?? "http://localhost:3000/api/notion/callback";

    if (!clientId) {
        return NextResponse.json({ error: "Notion OAuth not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        owner: "user",
        // state can carry userId for extra security
        state: session.user.id,
    });

    const url = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    return NextResponse.redirect(url);
}
