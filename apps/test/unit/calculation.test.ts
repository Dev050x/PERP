import { describe, expect, test } from "bun:test";
import { calculateMargin, getStatus, calculateLiquidationPrice, calculateAveragePrice, calculateUnrealPnl } from "../../engine/src/utils/calculation";
import { resolveStatus } from "../../engine/src/utils/utility";
import type { Position } from "types";

describe("calculateMargin", () => {
    test("returns proportional margin for partial quantity", () => {
        expect(calculateMargin(1000n, 500n, 200n)).toBe(100n);
    });

    test("returns zero when remaining quantity is zero", () => {
        expect(calculateMargin(1000n, 0n, 200n)).toBe(0n);
    });

    test("returns full margin when qty unchanged", () => {
        expect(calculateMargin(1000n, 1000n, 200n)).toBe(200n);
    });
});

describe("getStatus — CORRECT behavior", () => {
    test("returns 'open' when no quantity filled (qty unchanged)", () => {

        expect(getStatus(100n, 100n)).toBe("open");
    });

    test("returns 'partiallyFilled' when some quantity was matched", () => {

        expect(getStatus(100n, 60n)).toBe("partiallyFilled");
    });
});

describe("resolveStatus", () => {
    test("returns 'Filled' when all quantity matched", () => {
        expect(resolveStatus(100n, 100n)).toBe("Filled");
    });

    test("returns 'open' when nothing matched", () => {
        expect(resolveStatus(0n, 100n)).toBe("open");
    });

    test("returns 'partiallyFilled' for partial match", () => {
        expect(resolveStatus(40n, 100n)).toBe("partiallyFilled");
    });
});

describe("calculateLiquidationPrice", () => {
    const SCALE = 100000000n;

    test("LONG: correct liquidation price computation", () => {
        const price = 100n * SCALE;
        const qty = 10n * SCALE;
        const margin = 500n * SCALE;
        const result = calculateLiquidationPrice(price, qty, margin, "LONG");
        const expected = (price * qty - margin * SCALE) / qty;
        expect(result).toBe(expected);
    });

    test("LONG: liquidation at zero when margin covers full notional", () => {
        const price = 100n * SCALE;
        const qty = 10n * SCALE;
        const margin = (price * qty) / SCALE;
        const result = calculateLiquidationPrice(price, qty, margin, "LONG");
        expect(result).toBe(0n);
    });

    test("SHORT: correct liquidation price computation", () => {
        const price = 100n * SCALE;
        const qty = 10n * SCALE;
        const margin = 500n * SCALE;
        const result = calculateLiquidationPrice(price, qty, margin, "SHORT");
        const expected = (price * qty + margin * SCALE) / qty;
        expect(result).toBe(expected);
    });
});

describe("calculateAveragePrice — CORRECT weighted average", () => {
    test("computes weighted average price correctly", () => {

        const result = calculateAveragePrice(100n, 10n, 200n, 20n);
        const expected = (100n * 10n + 200n * 20n) / (10n + 20n);
        expect(result).toBe(expected);
    });

    test("handles zero previous quantity", () => {
        const result = calculateAveragePrice(0n, 0n, 150n, 10n);
        expect(result).toBe(150n);
    });

    test("handles equal split correctly", () => {
        const result = calculateAveragePrice(100n, 5n, 200n, 5n);
        const expected = (100n * 5n + 200n * 5n) / 10n;
        expect(result).toBe(expected);
    });
});

describe("calculateUnrealPnl", () => {
    function makePos(overrides: Partial<Position> = {}): Position {
        return {
            side: "LONG", qty: 10n, averagePrice: 100n, margin: 500n,
            liquidationPrice: 50n, pnl: 0n, userId: "test", market: "SOL",
            ...overrides,
        };
    }

    test("LONG: positive PnL when price increases", () => {
        expect(calculateUnrealPnl(makePos({ side: "LONG", averagePrice: 100n, qty: 10n }), 120n)).toBe(200n);
    });

    test("LONG: negative PnL when price decreases", () => {
        expect(calculateUnrealPnl(makePos({ side: "LONG", averagePrice: 100n, qty: 10n }), 80n)).toBe(-200n);
    });

    test("SHORT: positive PnL when price decreases", () => {
        expect(calculateUnrealPnl(makePos({ side: "SHORT", averagePrice: 100n, qty: 10n }), 80n)).toBe(200n);
    });

    test("SHORT: negative PnL when price increases", () => {
        expect(calculateUnrealPnl(makePos({ side: "SHORT", averagePrice: 100n, qty: 10n }), 120n)).toBe(-200n);
    });
});
