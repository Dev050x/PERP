import type { Fill, Order, Position, UserBalance } from "types";
import { toString } from "./conversion";

export function SerializableUserBalances(
    balances: Record<string, UserBalance>
): { availableBalance: string; lockedBalance: string } {
    const usdc = balances["USDC"] ?? { availableBalance: 0n, lockedBalance: 0n };
    return {
        availableBalance: toString(usdc.availableBalance),
        lockedBalance: toString(usdc.lockedBalance),
    };
};

export function SerializeData(data: Order | Fill | Position): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === "bigint") {
            result[key] = toString(value);
            continue;
        }
        result[key] = value;
    }
    return result;
}

export function serializeFills(fills: Fill[]): Record<string, string>[] {
    const serFills: Record<string, string>[] = [];
    for (const fill of fills) {
        serFills.push(SerializeData(fill));
    }
    return serFills;
}