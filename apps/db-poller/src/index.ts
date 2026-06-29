import type { EngineResponse } from "types/receiver";
import { RedisManager } from "./redis-manager";
import { createOrder } from "../controllers/create-order";
import { createCandle } from "../controllers/create-candle";


void createCandle();

function handleEngineResponse(data: EngineResponse) {
    if (data.msg === "CreateOrder") {
        createOrder(data.data);
    }
}

for (; ;) {
    const redisManager = RedisManager.getInstance();
    const item = await redisManager.readMsg();
    const raw_data = item?.[0]?.messages?.[0]?.message["message"];
    if (!raw_data || raw_data.ok) continue;
    const data = JSON.parse(raw_data) as EngineResponse;
    const response = handleEngineResponse(data);
}