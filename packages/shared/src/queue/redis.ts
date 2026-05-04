import Redis from "ioredis";

const REDIS_HOST_URL = process.env.REDIS_HOST_URL;

if (!REDIS_HOST_URL) {
    throw new Error("REDIS_HOST_URL is not set");
}

const isUrl = REDIS_HOST_URL.includes("://");

export const redis = isUrl
    ? new Redis(REDIS_HOST_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
    })
    : new Redis({
        host: REDIS_HOST_URL,
        maxRetriesPerRequest: null,
        lazyConnect: true,
    });
