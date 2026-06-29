import { describe, expect, test } from "bun:test";
import { UserManager } from "../../engine/src/store/user-manager";

const PRECISION = 8;

function scaled(value: string): bigint {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(PRECISION, "0"));
}

function freshUser(): string {
    return "pos-" + crypto.randomUUID().slice(0, 8);
}

describe("Position Management — Integration", () => {
    test("open LONG and increase same-side", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
        um.createUserPosition(uid, scaled("120"), "SOL", scaled("5"), "LONG", scaled("300"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.qty).toBe(scaled("15"));
        expect(pos.margin).toBe(scaled("800"));
        expect(pos.averagePrice).toBeGreaterThan(scaled("100"));
    });

    test("open LONG and reduce with smaller opposite-side", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
        um.createUserPosition(uid, scaled("110"), "SOL", scaled("4"), "SHORT", scaled("200"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.side).toBe("LONG");
        expect(pos.qty).toBe(scaled("6"));

        expect(pos.averagePrice).toBe(scaled("100"));
    });

    test("open LONG and flip with larger opposite-side", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("5"), "LONG", scaled("250"));
        um.createUserPosition(uid, scaled("110"), "SOL", scaled("10"), "SHORT", scaled("500"));

        const pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.side).toBe("SHORT");
        expect(pos.qty).toBe(scaled("5"));
    });

    test("open LONG and close with exact opposite-side", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
        um.createUserPosition(uid, scaled("120"), "SOL", scaled("10"), "SHORT", scaled("500"));

        const pos = um.getUserPositionByMarket(uid, "SOL");
        expect(pos).toBeNull();
    });

    test("full lifecycle: LONG increase → SHORT reduce → SHORT flip → close", () => {
        const uid = freshUser();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid);

        um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));

        um.createUserPosition(uid, scaled("120"), "SOL", scaled("5"), "LONG", scaled("300"));
        let pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.qty).toBe(scaled("15"));

        um.createUserPosition(uid, scaled("110"), "SOL", scaled("5"), "SHORT", scaled("250"));
        pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.side).toBe("LONG");
        expect(pos.qty).toBe(scaled("10"));

        um.createUserPosition(uid, scaled("130"), "SOL", scaled("15"), "SHORT", scaled("750"));
        pos = um.getUserPositionByMarket(uid, "SOL")!;
        expect(pos.side).toBe("SHORT");
        expect(pos.qty).toBe(scaled("5"));

        um.createUserPosition(uid, scaled("120"), "SOL", scaled("5"), "LONG", scaled("250"));
        pos = um.getUserPositionByMarket(uid, "SOL");
        expect(pos).toBeNull();
    });
});
