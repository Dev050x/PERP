import { createClient, type RedisClientType } from "redis";
import type { EngineResponse } from "types/receiver";

export class RedisManager {
    private publisher: RedisClientType;
    private receiver: RedisClientType;
    private static instance: RedisManager;
    private lastOffset: string;

    private constructor() {
        this.publisher = createClient();
        this.publisher.connect();
        this.receiver = createClient();
        this.receiver.connect();
        this.lastOffset = "";
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public getLastOffset() {
        return this.lastOffset;
    }

    public setLastOffset(offset: string) {
        this.lastOffset = offset;
    }

    public readDataFromStream(lastId: string) {
        const item = this.receiver.xRead({ key: "backend-to-engine", id: lastId }, { BLOCK: 5000, COUNT: 1 });
        return item;
    }

    public async readMissedMessages(afterId: string) {
        const items = await this.receiver.xRange("backend-to-engine", `(${afterId}`, "+");
        return items;
    }

    public publishData(data: EngineResponse) {
        this.publisher.xAdd("engine-to-backend", "*", {
            message: JSON.stringify(data),
        });
    }
}
