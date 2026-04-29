import Redis from "ioredis";
import { env } from "@/core/config/env";

const redisUrl = env.REDIS_URL;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const pubClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const subClient = pubClient.duplicate();

const handleRedisError = (clientName: string) => (error: Error) => {
  console.error(`[Redis] ${clientName} Error:`, error.message || error);
};

redis.on("error", handleRedisError("Main"));
pubClient.on("error", handleRedisError("Pub"));
subClient.on("error", handleRedisError("Sub"));

redis.on("connect", () => {
  console.log("✓ Redis connected");
});
