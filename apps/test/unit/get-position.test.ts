import { describe, expect, test } from "bun:test";
import { GetAllPositions, GetPosition } from "../../engine/src/controllers/get-position";
import type { EngineRequest } from "types/publisher";
import { UserManager } from "../../engine/src/store/user-manager";

function freshUserId(): string {
    return "getpos-user-" + crypto.randomUUID().slice(0, 8);
}

describe("GetPosition & GetAllPositions Controllers", () => {
    test("GetPosition returns serialized position for existing market", () => {
        const uid = freshUserId();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid, 100_000_000_000n);

        // Create a position for SOL
        um.createUserPosition(uid, 10_000_000_000n, "SOL", 1_000_000_000n, "LONG", 50_000_000_000n);

        const result = GetPosition({ userId: uid, marketId: "SOL" });
        expect(result).toBeDefined();
        expect(result.position).toBeDefined();
        expect(result.position.market).toBe("SOL");
        expect(result.position.side).toBe("LONG");
    });

    test("GetPosition throws error when position does not exist for market", () => {
        const uid = freshUserId();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid, 100_000_000_000n);

        expect(() => GetPosition({ userId: uid, marketId: "ETH" })).toThrow(
            "User does not have any open positions for this asset"
        );
    });

    test("GetAllPositions returns all open positions across markets for user", () => {
        const uid = freshUserId();
        const um = UserManager.getInstance();
        um.initializeUserBalance(uid, 100_000_000_000n);

        // Create positions for SOL and ETH
        um.createUserPosition(uid, 10_000_000_000n, "SOL", 1_000_000_000n, "LONG", 50_000_000_000n);
        um.createUserPosition(uid, 3_000_000_000n, "ETH", 2_000_000_000n, "SHORT", 30_000_000_000n);

        const result = GetAllPositions({ userId: uid });
        expect(result).toBeDefined();
        expect(result.positions).toBeArray();
        expect(result.positions.length).toBe(2);

        const markets = result.positions.map((p) => p.market);
        expect(markets).toContain("SOL");
        expect(markets).toContain("ETH");
    });

    test("GetAllPositions returns empty array when user has no open positions", () => {
        const uid = freshUserId();
        const result = GetAllPositions({ userId: uid });
        expect(result).toBeDefined();
        expect(result.positions).toBeArray();
        expect(result.positions.length).toBe(0);
    });
});
