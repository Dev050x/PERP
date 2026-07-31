import { describe, expect, test } from "bun:test";
import { OnRamp } from "../../engine/src/controllers/onramp";
import type { EngineRequest } from "types/publisher";
import { UserManager } from "../../engine/src/store/user-manager";

function freshUserId(): string {
    return "onramp-user-" + crypto.randomUUID().slice(0, 8);
}

describe("OnRamp Controller", () => {
    test("processes valid OnRamp EngineRequest successfully", () => {
        const uid = freshUserId();
        const request: EngineRequest = {
            msg: "OnRamp",
            correlationID: "corr-101",
            data: {
                userId: uid,
                amount: "1000",
            },
        };

        const result = OnRamp(request);
        expect(result).toBeDefined();
        expect(result?.userBalance).toBeDefined();
        expect(result?.userBalance.USDC).toBeDefined();
        expect(result?.userBalance.USDC?.availableBalance).toBe("100000000000"); // 1000 scaled by 8 decimals
    });

    test("returns undefined for non-OnRamp message types", () => {
        const uid = freshUserId();
        const request: EngineRequest = {
            msg: "CancelOrder",
            correlationID: "corr-102",
            data: {
                userId: uid,
                orderId: "ord-1",
            },
        };

        const result = OnRamp(request);
        expect(result).toBeUndefined();
    });
});
