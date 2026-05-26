import type { EngineRequest } from "types/publisher";
import { RedisManager } from "./store/RedisManager";
import { UserManager } from "./store/UserManager";
import { SerializableUserBalances } from "./utils/serialize";

function handleEngineRequest(data: EngineRequest) {
    if (data.msg === "OnRamp") {
        const user = UserManager.getInstance().createUser(data.data.userId);
        const userBalance = UserManager.getInstance().initializeUserBalance(data.data.userId);
        const serializeUserBalance = SerializableUserBalances(userBalance);
        return {
            userBalance: serializeUserBalance,
        }
    }
}

while (1) {
    const redisManager = RedisManager.getInstance();
    const item = await redisManager.readDataFromSream();
    const raw_data= item?.[0]?.messages?.[0]?.message["message"];
    if(!raw_data) continue;
    const received_data: EngineRequest = JSON.parse(raw_data);
    console.log("received data", received_data);
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
