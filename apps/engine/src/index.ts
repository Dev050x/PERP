import type { EngineRequest } from "types/publisher";
import { RedisManager } from "./store/redis-manager";
import { CreateOrder,InitializeOrderBook} from "./controllers/create-order";
import { CancelOrder } from "./controllers/cancel-order";
import { debugState } from "./utils/debug";
import { GetPosition } from "./controllers/get-position";
import { getOpenOrders, getOrders } from "./controllers/get-orders";
import { getFill } from "./controllers/get-fills";
import { markPrice } from "./controllers/mark-price";
import { getDepth } from "./controllers/get-depth";
import { OnRamp } from "./controllers/onramp";

function handleEngineRequest(data: EngineRequest) {
    if (data.msg === "OnRamp") {
        return OnRamp(data);
    }else if(data.msg === "CreateOrder"){
        return CreateOrder(data.data);
    }else if(data.msg === "InitializeOrderBook") {
        return InitializeOrderBook(data);
    }else if(data.msg === "CancelOrder") {
        return CancelOrder(data.data);
    }else if(data.msg === "GetPosition") {
        return GetPosition(data.data);
    }else if(data.msg === "GetOrders") {
        return getOrders(data.data)
    }else if(data.msg === "GetOpenOrders"){
        return getOpenOrders(data.data)
    }else if(data.msg === "GetFills") {
        return getFill(data.data);
    }else if(data.msg === "MarkPrice") {
        markPrice(data.data);
    }else if(data.msg === "GetDepth") {
        return getDepth(data.data.market);
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
        if(!response_data) {
            continue;
        }
        // console.log("data:", response_data);
        await RedisManager.getInstance().publishData({
            msg: received_data.msg,
            correlationId: received_data.correlationID,
            ok: true,
            data: response_data,
        });
        // debugState();

    } catch (error) {
        console.log("caught some error for user request", error);
        await RedisManager.getInstance().publishData({
            correlationId: received_data.correlationID,
            ok: false,
            error: error instanceof Error ? error.message : "engine_error"
        });
    }

}
