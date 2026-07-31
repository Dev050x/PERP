import type { EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances } from "../utils/serialize";

export function GetBalance(data: EngineRequest) {
    if (data.msg === "GetBalance") {
        const userBalance = UserManager.getInstance().getUserBalances(data.data.userId)!;
        const serializeUserBalance = SerializableUserBalances(userBalance);
        return {
            userBalance: serializeUserBalance,
        };
    }
}
