import { createClient, type RedisClientType } from "redis";
import type { EngineRequest } from "types/publisher";

export class RedisManager {
  private publisher: RedisClientType;
  private receiver: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.publisher = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
    });
    this.publisher.on("error", (err) =>
      console.error("Redis publisher error:", err),
    );
    this.publisher.connect();

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

  public async publishMessage(data: EngineRequest) {
    await this.publisher.xAdd("backend-to-engine", "*", {
      message: JSON.stringify(data),
    });
  }

  public async readMessage() {
    return this.receiver.xRead(
      { key: "engine-to-backend", id: "$" },
      { BLOCK: 5000, COUNT: 1 },
    );
  }
}
