import { createClient, type RedisClientType } from "redis";

export class RedisManager {
  private static instance: RedisManager;
  private receiver: RedisClientType;
  private lastId = "$";
  private constructor() {
    this.receiver = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
    });
    this.receiver.on("error", (err) =>
      console.error("Redis receiver error:", err),
    );
    this.receiver.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public async readMesage() {
    const item = await this.receiver.xRead(
      { key: "engine-to-backend", id: this.lastId },
      { BLOCK: 5000, COUNT: 1 },
    );
    const entryId = item?.[0]?.messages?.[0]?.id;
    if (entryId) {
      this.lastId = entryId;
    }
    return item;
  }
}
