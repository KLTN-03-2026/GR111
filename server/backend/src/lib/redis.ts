import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const pubClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const subClient = pubClient.duplicate();

// --- Error handling ---

const handleRedisError = (clientName: string) => (err: Error) => {
  console.error(`[Redis] ${clientName} Error:`, err.message || err);
};

redis.on("error", handleRedisError("Main"));
pubClient.on("error", handleRedisError("Pub"));
subClient.on("error", handleRedisError("Sub"));

redis.on("connect", () => {
  console.log("✓ Redis connected");
});
