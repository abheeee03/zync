import { Queue } from "bullmq"
import { redis } from "./redis"

export let QUEUE_NAME = "workflow-runs"
export const createWorkflowQueue = () => {
    return new Queue(QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: { count: 100, age: 24 * 3600 },
            removeOnFail: { count: 100, age: 24 * 3600 },
        }
    })
}
export {redis};