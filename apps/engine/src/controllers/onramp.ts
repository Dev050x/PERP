import type { EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances } from "../utils/serialize";
import { PRECISION, toBigInt } from "../utils/conversion";

export function OnRamp(data: EngineRequest) {
    if (data.msg === "OnRamp") {
        const userBalance = UserManager.getInstance().initializeUserBalance(
            data.data.userId,
            toBigInt(data.data.amount, PRECISION),
        );
        const serializeUserBalance = SerializableUserBalances(userBalance);
        return {
            userBalance: serializeUserBalance,
        };
    }
}
