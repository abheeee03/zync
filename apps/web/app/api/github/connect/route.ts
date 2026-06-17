import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3000/api/github/callback";

    if (!clientId) {
        return NextResponse.json({ error: "GitHub OAuth not configured (missing GITHUB_CLIENT_ID)" }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "repo,user",
        state: session.user.id,
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return NextResponse.redirect(url);
}
