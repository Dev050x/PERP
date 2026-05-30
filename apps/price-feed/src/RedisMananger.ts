import { createClient, type RedisClientType } from "redis";
import type { EngineRequest } from "types/publisher";

export class RedisManager{
    private static instance: RedisManager;
    private publisher: RedisClientType;

    private constructor() {
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static getInstance() {
        if(!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public publish(data: EngineRequest) {
        this.publisher.xAdd("backend-to-engine", "*" , {
            message: JSON.stringify(data),
        })
    }
}