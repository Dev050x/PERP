import { createClient, type RedisClientType } from "redis";

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

    public ReadDataFromSream() {
        return this.receiver.xRead(
            { key: 'backend-to-engine', id: '$' },
            { BLOCK: 5000, COUNT: 1 }
        );
    };;


}