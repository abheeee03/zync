
import { Worker } from "bullmq";
import { ExecuteJob } from "./engine";
import { redis } from "@repo/shared/queue";

let QUEUE_NAME = "workflow-runs"

export const worker = new Worker(QUEUE_NAME, async (job) => {
    if (!job.data?.runId) {
        throw new Error("runId is required for workflow job");
    }

    try {
        await ExecuteJob(job.data.runId);
    } catch (e) {
        console.error("Worker error:", e);
        throw e;
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