import { describe, expect, test } from "bun:test";
import { UserManager } from "../../engine/src/store/user-manager";

const PRECISION = 8;

function scaled(value: string): bigint {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(PRECISION, "0"));
}

function freshUserId(): string {
    return "ut-user-" + crypto.randomUUID().slice(0, 8);
}

describe("UserManager", () => {
    describe("initializeUserBalance", () => {
        test("creates user with 10,000 USDC available balance", () => {
            const uid = freshUserId();
            const balances = UserManager.getInstance().initializeUserBalance(uid);
            expect(balances["USDC"].availableBalance).toBe(10000_000_000n);
            expect(balances["USDC"].lockedBalance).toBe(0n);
        });

        test("initializes all supported assets with zero balance", () => {
            const uid = freshUserId();
            const balances = UserManager.getInstance().initializeUserBalance(uid);
            expect(balances["SOL"].availableBalance).toBe(0n);
            expect(balances["ETH"].availableBalance).toBe(0n);
        });
    });

    describe("hasEnoughBalance", () => {
        test("returns true when margin is affordable", () => {
            const uid = freshUserId();
            UserManager.getInstance().initializeUserBalance(uid);
            expect(UserManager.getInstance().hasEnoughBalance(uid, scaled("100"), "USDC")).toBe(true);
        });

        test("returns false when margin exceeds balance", () => {
            const uid = freshUserId();
            UserManager.getInstance().initializeUserBalance(uid);
            expect(UserManager.getInstance().hasEnoughBalance(uid, 999999999999n, "USDC")).toBe(false);
        });
    });

    describe("lockUserBalance / unlockUserBalance", () => {
        test("lock moves available to locked", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.lockUserBalance(uid, "USDC", scaled("500"));
            const bal = um.getUserBalances(uid)!;
            expect(bal["USDC"].availableBalance).toBe(10000_000_000n - scaled("500"));
            expect(bal["USDC"].lockedBalance).toBe(scaled("500"));
        });

        test("unlock reverses the lock", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.lockUserBalance(uid, "USDC", scaled("500"));
            um.unlockUserBalance(uid, "USDC", scaled("500"));
            const bal = um.getUserBalances(uid)!;
            expect(bal["USDC"].availableBalance).toBe(10000_000_000n);
            expect(bal["USDC"].lockedBalance).toBe(0n);
        });
    });

    describe("createUserPosition", () => {
        test("creates a new LONG position with calculated liquidation price", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
            const pos = um.getUserPositionByMarket(uid, "SOL")!;
            expect(pos.side).toBe("LONG");
            expect(pos.qty).toBe(scaled("10"));
            expect(pos.margin).toBe(scaled("500"));
            expect(pos.averagePrice).toBe(scaled("100"));
            expect(pos.liquidationPrice).toBeGreaterThan(0n);
        });

        test("creates a new SHORT position", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "ETH", scaled("10"), "SHORT", scaled("500"));
            const pos = um.getUserPositionByMarket(uid, "ETH")!;
            expect(pos.side).toBe("SHORT");
        });

        test("increases position qty and updates avg price for same side", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
            um.createUserPosition(uid, scaled("200"), "SOL", scaled("5"), "LONG", scaled("300"));
            const pos = um.getUserPositionByMarket(uid, "SOL")!;
            expect(pos.qty).toBe(scaled("15"));
            expect(pos.margin).toBe(scaled("800"));
        });

        test("reduces position for opposite side with smaller qty", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
            um.createUserPosition(uid, scaled("120"), "SOL", scaled("4"), "SHORT", scaled("200"));
            const pos = um.getUserPositionByMarket(uid, "SOL")!;
            expect(pos.side).toBe("LONG");
            expect(pos.qty).toBe(scaled("6"));
        });

        test("flips position when opposite side qty exceeds current", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "SOL", scaled("5"), "LONG", scaled("250"));
            um.createUserPosition(uid, scaled("110"), "SOL", scaled("10"), "SHORT", scaled("500"));
            const pos = um.getUserPositionByMarket(uid, "SOL")!;
            expect(pos.side).toBe("SHORT");
            expect(pos.qty).toBe(scaled("5"));
        });

        test("closes position when opposite side qty matches exactly", () => {
            const uid = freshUserId();
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.createUserPosition(uid, scaled("100"), "SOL", scaled("10"), "LONG", scaled("500"));
            um.createUserPosition(uid, scaled("120"), "SOL", scaled("10"), "SHORT", scaled("500"));
            const pos = um.getUserPositionByMarket(uid, "SOL");
            expect(pos).toBeNull();
        });
    });

    describe("addUserOrder", () => {
        test("records order in user's order map", () => {
            const uid = freshUserId();
            const oid = "order-" + crypto.randomUUID().slice(0, 8);
            const um = UserManager.getInstance();
            um.initializeUserBalance(uid);
            um.addUserOrder(
                { userId: uid, qty: "10", margin: "500", side: "LONG", type: "limit", price: "100", market: "SOL" },
                oid, "open"
            );
            const order = um.getUserOrder(uid, oid);
            expect(order).toBeDefined();
            expect(order!.qty).toBe(scaled("10"));
            expect(order!.status).toBe("open");
        });
    });
});
