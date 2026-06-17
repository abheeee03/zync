import { prisma } from "@repo/prisma/client";
import { createWorkflowQueue } from "@repo/shared/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const eventHeader = request.headers.get("x-github-event") || "";
    let body: any;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const repoName = body?.repository?.full_name;
    if (!repoName) {
        return NextResponse.json({ message: "No repository name in payload" }, { status: 400 });
    }

    // Map github events to the respective available trigger name
    let triggerName = "";
    if (eventHeader === "push") {
        triggerName = "push";
    } else if (eventHeader === "pull_request") {
        triggerName = "pull_request";
    } else if (eventHeader === "issues" && body.action === "opened") {
        triggerName = "issue_opened";
    } else if (eventHeader === "release" && body.action === "published") {
        triggerName = "release_published";
    }

    if (!triggerName) {
        return NextResponse.json({ message: `Ignored event/action: ${eventHeader}/${body?.action}` }, { status: 200 });
    }

    // Query active triggers matching target name
    const activeTriggers = await prisma.trigger.findMany({
        where: {
            availbleTriggers: {
                name: triggerName,
            },
            workflow: {
                isActive: true,
            },
        },
        include: {
            workflow: true,
        },
    });

    // Filter by repository configured in the trigger metadata
    const matchedTriggers = activeTriggers.filter((t) => {
        const meta = t.metaData as any;
        const targetRepo = typeof meta?.repository === "string" ? meta.repository.trim() : "";
        return targetRepo.toLowerCase() === repoName.toLowerCase();
    });

    if (matchedTriggers.length === 0) {
        return NextResponse.json({ message: `No active workflows found matching repo: ${repoName} and trigger: ${triggerName}` }, { status: 200 });
    }

    const workflowQueue = createWorkflowQueue();
    if (!workflowQueue) {
        return NextResponse.json({ error: "Internal Server Error (Queue Connection Failed)" }, { status: 500 });
    }

    const triggeredRunIds: string[] = [];

    for (const t of matchedTriggers) {
        // Create workflow run
        const run = await prisma.workflowRun.create({
            data: {
                workflowId: t.workflowId,
            },
            select: {
                id: true,
            },
        });

        const triggerPayload = {
            event: eventHeader,
            repository: repoName,
            sender: body?.sender?.login || "",
            ref: body?.ref || "",
            commit_sha: body?.after || "",
            pr_number: body?.pull_request?.number || "",
            pr_title: body?.pull_request?.title || "",
            pr_action: body?.action || "",
            issue_number: body?.issue?.number || "",
            issue_title: body?.issue?.title || "",
            issue_action: body?.action || "",
            release_tag: body?.release?.tag_name || "",
            release_name: body?.release?.name || "",
            body, // Store raw body for full access
        };

        // Queue the run execution with custom payload
        await workflowQueue.add("workflow-run", {
            runId: run.id,
            triggerPayload,
        }, {
            jobId: run.id,
        });

        triggeredRunIds.push(run.id);
    }

    return NextResponse.json({
        message: `Triggered ${triggeredRunIds.length} workflow run(s)`,
        runs: triggeredRunIds,
    });
}
