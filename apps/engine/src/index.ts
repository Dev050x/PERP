import type { EngineRequest } from "types/publisher";
import { RedisManager } from "./store/RedisManager";
import { CreateOrder, InitializeOrderBook, OnRamp } from "./controllers/Orders";

function handleEngineRequest(data: EngineRequest) {
    if (data.msg === "OnRamp") {
        return OnRamp(data);
    }else if(data.msg === "CreateOrder"){
        CreateOrder(data);
    }else if(data.msg === "InitializeOrderBook") {
        return InitializeOrderBook(data);
    }
}

while (1) {

    const redisManager = RedisManager.getInstance();
    const item = await redisManager.readDataFromSream();
    const raw_data= item?.[0]?.messages?.[0]?.message["message"];
    if(!raw_data) continue;
    const received_data: EngineRequest = JSON.parse(raw_data);
    // console.log("received data", received_data);
    try {
        const response_data = handleEngineRequest(received_data)!;
        console.log("data:", response_data);
        await RedisManager.getInstance().publishData({
            correlationId: received_data.correlationID,
            ok: true,
            data: response_data,
        });

    } catch (error) {
        await RedisManager.getInstance().publishData({
            correlationId: received_data.correlationID,
            ok: false,
            error: error instanceof Error ? error.message : "engine_error"
        });
    }

}
