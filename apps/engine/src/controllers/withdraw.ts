import type { EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances } from "../utils/serialize";
import { PRECISION, toBigInt } from "../utils/conversion";

export function Withdraw(data: EngineRequest) {
    if (data.msg === "Withdraw") {
        const userBalance = UserManager.getInstance().withdrawUserBalance(
            data.data.userId,
            toBigInt(data.data.amount, PRECISION),
        );
        const serializeUserBalance = SerializableUserBalances(userBalance);
        return {
            userBalance: serializeUserBalance,
        };
    }
}
