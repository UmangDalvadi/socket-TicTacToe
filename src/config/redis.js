import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.on("connect", () => {
  console.log("🟢 Connected to Redis");
});

redisClient.on("error", (error) => {
  console.error("🔴 Error connecting to Redis: ", error);
});

export default redisClient;
