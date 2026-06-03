import { createClient, type RedisClientType } from "redis";

export class RedisManager {
    private static instance: RedisManager;
    private receiver: RedisClientType;
    private constructor() {
        this.receiver = createClient();
        this.receiver.connect();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public readMesage() {
        return this.receiver.xRead(
            { key: "engine-to-backend", id: "$" },
            { BLOCK: 5000, COUNT: 1 }
        );
    }
}