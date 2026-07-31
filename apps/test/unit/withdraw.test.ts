import { describe, expect, test } from "bun:test";
import { Withdraw } from "../../engine/src/controllers/withdraw";
import type { EngineRequest } from "types/publisher";
import { UserManager } from "../../engine/src/store/user-manager";

function freshUserId(): string {
    return "withdraw-user-" + crypto.randomUUID().slice(0, 8);
}

describe("Withdraw Controller & UserManager.withdrawUserBalance", () => {
    test("deducts balance successfully when user has enough USDC balance", () => {
        const uid = freshUserId();
        // Initialize user balance (100 USDC = 10000_000_000n)
        UserManager.getInstance().initializeUserBalance(uid, 10000_000_000n);

        const request: EngineRequest = {
            msg: "Withdraw",
            correlationID: "corr-w-101",
            data: {
                userId: uid,
                amount: "20",
            },
        };

        const result = Withdraw(request);
        expect(result).toBeDefined();
        expect(result?.userBalance).toBeDefined();
        // 100 - 20 = 80
        expect(result?.userBalance.availableBalance).toBe("80");
    });

    test("throws Insufficient Balance error when withdrawal amount exceeds available balance", () => {
        const uid = freshUserId();
        UserManager.getInstance().initializeUserBalance(uid, 10_000_000_000n);

        const request: EngineRequest = {
            msg: "Withdraw",
            correlationID: "corr-w-102",
            data: {
                userId: uid,
                amount: "50000", // Exceeds initial 10,000 balance
            },
        };

        expect(() => Withdraw(request)).toThrow("Insufficient Balance");
    });

    test("throws error when user does not exist", () => {
        const nonExistentUserId = "non-existent-user-999";
        const request: EngineRequest = {
            msg: "Withdraw",
            correlationID: "corr-w-103",
            data: {
                userId: nonExistentUserId,
                amount: "100",
            },
        };

        expect(() => Withdraw(request)).toThrow("user does not deposit any asset");
    });

    test("returns undefined for non-Withdraw message types", () => {
        const uid = freshUserId();
        const request: EngineRequest = {
            msg: "CancelOrder",
            correlationID: "corr-w-104",
            data: {
                userId: uid,
                orderId: "ord-1",
            },
        };

        const result = Withdraw(request);
        expect(result).toBeUndefined();
    });
});
