import { createClient, type RedisClientType } from "redis";
import type { ToEngine } from "types/publisher";

export class RedisManager {
    private publisher: RedisClientType;
    private receiver: RedisClientType;
    private static instance: RedisManager;

    private constructor() {
        this.publisher = createClient();
        this.publisher.connect();
        this.receiver = createClient();
        this.receiver.connect();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public publishMessage(data: ToEngine) {
        this.publisher.xAdd("backend-to-engine", "*", data);
    }

}