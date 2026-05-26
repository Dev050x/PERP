import type { EngineResponse} from "types/receiver";
import { RedisManager } from "../store/redis-manager";
import { resolvePromise } from "./pending-response";

export async function listeningForEngineResponse(): Promise<void> {
    while (1) {
        console.log("checking for a response");
        const item = await RedisManager.getInstance().readMessage();
        const raw_data = item?.[0]?.messages[0]?.message["message"];
        if(!raw_data) continue;
        const data = JSON.parse(raw_data) as EngineResponse;
        resolvePromise(data);
    }
}