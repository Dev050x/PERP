import { describe, expect, test } from "bun:test";
import { GetBalance } from "../../engine/src/controllers/get-balance";
import type { EngineRequest } from "types/publisher";
import { UserManager } from "../../engine/src/store/user-manager";

function freshUserId(): string {
    return "getbal-user-" + crypto.randomUUID().slice(0, 8);
}

describe("GetBalance Controller", () => {
    test("returns serialized balance for existing user", () => {
        const uid = freshUserId();
        // Initialize user balance
        UserManager.getInstance().initializeUserBalance(uid, 50000000000n); // 500 USDC

        const request: EngineRequest = {
            msg: "GetBalance",
            correlationID: "corr-gb-101",
            data: {
                userId: uid,
            },
        };

        const result = GetBalance(request);
        expect(result).toBeDefined();
        expect(result?.userBalance).toBeDefined();
        expect(result?.userBalance.availableBalance).toBe("500");
        expect(result?.userBalance.lockedBalance).toBe("0");
    });

    test("throws error when user has not deposited any asset", () => {
        const nonExistentUserId = "non-existent-getbal-user";
        const request: EngineRequest = {
            msg: "GetBalance",
            correlationID: "corr-gb-102",
            data: {
                userId: nonExistentUserId,
            },
        };

        expect(() => GetBalance(request)).toThrow("user does not deposit any asset");
    });

    test("returns undefined for non-GetBalance message types", () => {
        const uid = freshUserId();
        const request: EngineRequest = {
            msg: "CancelOrder",
            correlationID: "corr-gb-103",
            data: {
                userId: uid,
                orderId: "ord-1",
            },
        };

        const result = GetBalance(request);
        expect(result).toBeUndefined();
    });
});
