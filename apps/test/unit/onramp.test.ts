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
        expect(result?.userBalance.availableBalance).toBe("1000");
    });

    test("increments balance when user already exists", () => {
        const uid = freshUserId();
        const req1: EngineRequest = {
            msg: "OnRamp",
            correlationID: "corr-201",
            data: { userId: uid, amount: "1000" },
        };
        const req2: EngineRequest = {
            msg: "OnRamp",
            correlationID: "corr-202",
            data: { userId: uid, amount: "500" },
        };

        OnRamp(req1);
        const res2 = OnRamp(req2);

        expect(res2?.userBalance.availableBalance).toBe("1500");
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
