import type { EngineRequest } from "types/publisher";
import { UserManager } from "../store/UserManager";
import { SerializableUserBalances } from "../utils/serialize";
import { OrderBookManager } from "../store/OrderbookManager";

export function OnRamp(data: EngineRequest) {
    const user = UserManager.getInstance().createUser(data.data.userId);
    const userBalance = UserManager.getInstance().initializeUserBalance(data.data.userId);
    const serializeUserBalance = SerializableUserBalances(userBalance);
    return {
        userBalance: serializeUserBalance,
    }
}

export function CreateOrder(data: EngineRequest) {
    console.log("data received: ", data);
}

export function InitializeOrderBook(data: EngineRequest) {
    return OrderBookManager.getInstance().initializeOrderBooks();
}