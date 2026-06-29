import { describe, expect, test } from "bun:test";
import { SerializableUserBalances, SerializeData, serializeFills } from "../../engine/src/utils/serialize";
import type { Fill, Order } from "types";

describe("SerializableUserBalances", () => {
    test("converts BigInt balances to strings", () => {
        const result = SerializableUserBalances({
            USDC: { availableBalance: 10000000000n, lockedBalance: 5000000000n },
        });
        expect(result).toEqual({
            USDC: { availableBalance: "10000000000", lockedBalance: "5000000000" },
        });
    });

    test("returns empty object for empty input", () => {
        expect(SerializableUserBalances({})).toEqual({});
    });
});

describe("SerializeData", () => {
    test("converts Order bigints to strings", () => {
        const order: Order = {
            orderId: "ord-1", userId: "u1", market: "SOL", side: "LONG",
            qty: 10000000000n, margin: 50000000000n, type: "limit", price: 10000000000n, status: "open",
        };
        const result = SerializeData(order);
        expect(result.qty).toBeString();
        expect(result.margin).toBeString();
        expect(result.price).toBeString();
        expect(result.orderId).toBe("ord-1");
    });
});

describe("serializeFills", () => {
    test("serializes an array of fills", () => {
        const fills: Fill[] = [{
            sellOrderId: "s1", buyOrderId: "b1", makerId: "m1", takerId: "t1",
            LongUserId: "l1", ShortUserId: "s1", price: 10000000000n, qty: 5000000000n, market: "SOL",
        }];
        const result = serializeFills(fills);
        expect(result).toHaveLength(1);
        expect(result[0].price).toBeString();
    });

    test("returns empty array for empty fills", () => {
        expect(serializeFills([])).toEqual([]);
    });
});
