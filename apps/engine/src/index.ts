import type { EngineRequest } from "types/publisher";
import { RedisManager } from "./store/RedisManager";
import type { FromEngine } from "types/receiver";

async function handle_engine_request(data: EngineRequest): Promise<void> {
    
    if(data.msg === "OnRamp") {
        // We need to initialize user with Balance
    }

}

while (1) {
    const redisManager = RedisManager.getInstance();
    const item = await redisManager.ReadDataFromSream();
    if (!item) continue;

    const raw_data = item[0] as FromEngine;
    const data = raw_data.messages[0]?.message;
    
    if(!data){
        console.log("data is undefiend");
        continue;
    }

}
