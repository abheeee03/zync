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
        return NextResponse.redirect(new URL("/credentials?github=error", req.url));
    }

    if (state && state !== session.user.id) {
        return NextResponse.redirect(new URL("/credentials?github=error", req.url));
    }

    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    const redirectUri = process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3000/api/github/callback";

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!tokenRes.ok) {
        console.error("GitHub token exchange failed", await tokenRes.text());
        return NextResponse.redirect(new URL("/credentials?github=error", req.url));
    }

    const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
        console.error("GitHub OAuth error:", tokenData.error_description || tokenData.error);
        return NextResponse.redirect(new URL("/credentials?github=error", req.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch user details from GitHub to show connected username/workspace
    let githubUsername = "GitHub Account";
    try {
        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `token ${accessToken}`,
                "User-Agent": "Zync-Workflow-Engine",
            },
        });
        if (userRes.ok) {
            const userData = (await userRes.json()) as { login: string };
            githubUsername = userData.login;
        }
    } catch (err) {
        console.error("Failed to fetch GitHub user data", err);
    }

    // GitHub tokens don't expire unless revoked — store far-future date
    const farFuture = new Date("2099-01-01T00:00:00Z");

    // Upsert credential — name = "github" acts as the provider key
    await prisma.credential.upsert({
        where: {
            id: `github-${session.user.id}`,
        },
        create: {
            id: `github-${session.user.id}`,
            userId: session.user.id,
            name: "github",
            accessToken: accessToken,
            refreshToken: "", // GitHub has no refresh token in typical web flow unless using refresh token flow
            expiresAt: farFuture,
            scope: githubUsername,
            updatedAt: new Date(),
        },
        update: {
            accessToken: accessToken,
            scope: githubUsername,
            updatedAt: new Date(),
        },
    });

    return NextResponse.redirect(new URL("/credentials?github=connected", req.url));
}
