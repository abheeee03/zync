
import { Worker } from "bullmq";
import { ExecuteJob } from "./engine";
import { redis } from "@repo/shared/queue";
import { prisma } from "@repo/prisma/client";

let QUEUE_NAME = "workflow-runs"

export const worker = new Worker(QUEUE_NAME, async (job) => {
    if (job.data?.runId) {
        try {
            await ExecuteJob(job.data.runId);
        } catch (e) {
            console.error("Worker error:", e);
            throw e;
        }
    } else if (job.data?.workflowId) {
        try {
            const run = await prisma.workflowRun.create({
                data: {
                    workflowId: job.data.workflowId,
                },
                select: {
                    id: true,
                },
            });
            await ExecuteJob(run.id);
        } catch (e) {
            console.error("Worker error (scheduled):", e);
            throw e;
        }
    } else {
        throw new Error("runId or workflowId is required for workflow job");
    }
}, {
    connection: redis,
    concurrency: 5,
})

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});
worker.on('error', (err) => {
    console.error(`Worker error:`, err);
});