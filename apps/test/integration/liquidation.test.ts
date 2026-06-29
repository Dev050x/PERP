import { describe, expect, test } from "bun:test";
import { OrderBookManager } from "../../engine/src/store/orderbook-manager";
import { UserManager } from "../../engine/src/store/user-manager";
import { LiquidationManager } from "../../engine/src/store/liquidation-manager";

const PRECISION = 8;

function scaled(value: string): bigint {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(PRECISION, "0"));
}

function freshUser(): string {
    return "liq-" + crypto.randomUUID().slice(0, 8);
}

describe("Liquidation — Integration", () => {
    test("liquidates LONG when mark price drops below liquidation price", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        const lm = LiquidationManager.getInstance();

        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("200"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        const liqPrice = pos.liquidationPrice;

        const obm = OrderBookManager.getInstance();
        obm.setMarkPrice("SOL", liqPrice - 1n);
        lm.liquidateUser(liqPrice - 1n, "SOL");

        const posAfter = um.getUserPositionByMarket(uid, "SOL");
        expect(posAfter).toBeNull();
    });

    test("does NOT liquidate LONG when mark price stays above liq price", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        const lm = LiquidationManager.getInstance();

        um.initializeUserBalance(uid);
        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("200"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        const liqPrice = pos.liquidationPrice;

        const obm = OrderBookManager.getInstance();
        obm.setMarkPrice("SOL", liqPrice + 100n);
        lm.liquidateUser(liqPrice + 100n, "SOL");

        const posAfter = um.getUserPositionByMarket(uid, "SOL");
        expect(posAfter).not.toBeNull();
    });

    test("liquidates SHORT when mark price rises above liquidation price", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        const lm = LiquidationManager.getInstance();

        um.initializeUserBalance(uid);
        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "SHORT", scaled("200"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        const liqPrice = pos.liquidationPrice;

        const obm = OrderBookManager.getInstance();
        obm.setMarkPrice("SOL", liqPrice + 1n);
        lm.liquidateUser(liqPrice + 1n, "SOL");

        const posAfter = um.getUserPositionByMarket(uid, "SOL");
        expect(posAfter).toBeNull();
    });

    test("does NOT liquidate SHORT when mark price stays below liq price", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        const lm = LiquidationManager.getInstance();

        um.initializeUserBalance(uid);
        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "SHORT", scaled("200"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        const liqPrice = pos.liquidationPrice;

        const obm = OrderBookManager.getInstance();
        obm.setMarkPrice("SOL", liqPrice - 100n);
        lm.liquidateUser(liqPrice - 100n, "SOL");

        const posAfter = um.getUserPositionByMarket(uid, "SOL");
        expect(posAfter).not.toBeNull();
    });
});
