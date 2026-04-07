import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

let isConnected = false;

export async function connectRedis() {
  try {
    if (!isConnected) {
      await redisClient.connect();
      isConnected = true;
      console.log("✅ Redis Connected");
    }
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error.message);
  }
}

export async function getJsonCache(key) {
  try {
    if (!isConnected) await connectRedis();

    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`❌ Redis GET Error [${key}]:`, error.message);
    return null;
  }
}

export async function setJsonCache(key, value, ttlSeconds = 600) {
  try {
    if (!isConnected) await connectRedis();

    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`❌ Redis SET Error [${key}]:`, error.message);
    return false;
  }
}

export async function deleteCacheKeys(keys = []) {
  try {
    if (!isConnected) await connectRedis();
    if (!keys.length) return;

    await redisClient.del(keys);
  } catch (error) {
    console.error("❌ Redis DELETE Error:", error.message);
  }
}

export default redisClient;