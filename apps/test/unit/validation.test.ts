import { describe, expect, test } from "bun:test";
import { authSchema } from "types/auth";
import { createOrderSchema, deleteOrderSchema, getPositionSchema, getOrdersSchema, getDepthSchema } from "types/exchange";

describe("authSchema", () => {
    test("valid username and password", () => {
        expect(authSchema.safeParse({ username: "alice123", password: "secure99" }).success).toBe(true);
    });

    test("rejects username shorter than 5 characters", () => {
        expect(authSchema.safeParse({ username: "ab", password: "secure99" }).success).toBe(false);
    });

    test("rejects password shorter than 5 characters", () => {
        expect(authSchema.safeParse({ username: "alice123", password: "ab" }).success).toBe(false);
    });

    test("rejects missing fields", () => {
        expect(authSchema.safeParse({ username: "alice123" }).success).toBe(false);
    });
});

describe("createOrderSchema", () => {
    test("valid limit order", () => {
        const result = createOrderSchema.safeParse({
            type: "limit", side: "LONG", qty: "1.5", price: "100.50", margin: "500", market: "SOL",
        });
        expect(result.success).toBe(true);
    });

    test("valid market order (price optional)", () => {
        const result = createOrderSchema.safeParse({
            type: "market", side: "SHORT", qty: "2.0", margin: "1000", market: "ETH",
        });
        expect(result.success).toBe(true);
    });

    test("rejects precision exceeding 6 decimal places", () => {
        const result = createOrderSchema.safeParse({
            type: "limit", side: "LONG", qty: "1.1234567", price: "100.50", margin: "500", market: "SOL",
        });
        expect(result.success).toBe(false);
    });

    test("rejects invalid side", () => {
        const result = createOrderSchema.safeParse({
            type: "limit", side: "INVALID", qty: "1.5", price: "100.50", margin: "500", market: "SOL",
        });
        expect(result.success).toBe(false);
    });

    test("rejects missing required field", () => {
        const result = createOrderSchema.safeParse({
            type: "limit", side: "LONG", qty: "1.5", price: "100.50", market: "SOL",
        });
        expect(result.success).toBe(false);
    });
});

describe("getDepthSchema", () => {
    test("valid marketId", () => {
        expect(getDepthSchema.safeParse({ marketId: "SOL" }).success).toBe(true);
    });
});

describe("deleteOrderSchema", () => {
    test("valid orderId", () => {
        expect(deleteOrderSchema.safeParse({ orderId: "uuid-123" }).success).toBe(true);
    });
});

describe("getPositionSchema", () => {
    test("valid marketId", () => {
        expect(getPositionSchema.safeParse({ marketId: "SOL" }).success).toBe(true);
    });
});

describe("getOrdersSchema", () => {
    test("valid marketId", () => {
        expect(getOrdersSchema.safeParse({ marketId: "ETH" }).success).toBe(true);
    });
});
