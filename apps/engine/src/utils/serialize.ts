import type { UserBalance } from "types";

export function SerializableUserBalances(
    balances: Record<string, UserBalance>
): Record<string, { availableBalance: string; lockedBalance: string }> {
    const result: Record<string, { availableBalance: string; lockedBalance: string }> = {};
    for (const asset in balances) {
        result[asset] = {
            availableBalance: balances[asset]!.availableBalance.toString(),
            lockedBalance: balances[asset]!.lockedBalance.toString(),
        };
    }
    return result;
}