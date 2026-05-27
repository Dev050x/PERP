import { createClient, type RedisClientType } from "redis";
import type { EngineResponse } from "types/receiver";

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

    public readDataFromSream() {
        return this.receiver.xRead(
            { key: 'backend-to-engine', id: '$' },
            { BLOCK: 5000, COUNT: 1 }
        );
    };;

    public publishData(data: EngineResponse) {
        this.publisher.xAdd("engine-to-backend", "*", {
            message: JSON.stringify(data),
        });
    }

}