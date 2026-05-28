import type { Fill, Order, UserBalance } from "types";
import { toString } from "./conversion";

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
};

export function SerializeData(data: Order | Fill): Record<string, string> {
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