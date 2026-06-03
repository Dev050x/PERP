import type { EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances } from "../utils/serialize";

export function OnRamp(data: EngineRequest) {
    const userBalance = UserManager.getInstance().initializeUserBalance(data.data.userId);
    const serializeUserBalance = SerializableUserBalances(userBalance);
    return {
        userBalance: serializeUserBalance,
    }
}