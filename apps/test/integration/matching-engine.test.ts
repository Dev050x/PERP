import { describe, expect, test } from "bun:test";
import { OrderBookManager } from "../../engine/src/store/orderbook-manager";
import { UserManager } from "../../engine/src/store/user-manager";

const PRECISION = 8;

function scaled(value: string): bigint {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole + fraction.padEnd(PRECISION, "0"));
}

function freshId(prefix: string): string {
    return prefix + "-" + crypto.randomUUID().slice(0, 8);
}

describe("Matching Engine — Integration", () => {
    test("LONG taker fills against SHORT maker at same price", () => {
        const maker = freshId("maker");
        const taker = freshId("taker");
        const makerOrderId = freshId("mo");
        const takerOrderId = freshId("to");
        const market = "SOL";
        const price = "77";
        const qty = "10";
        const makerMargin = "500";
        const takerMargin = "1000";

        const um = UserManager.getInstance();
        const obm = OrderBookManager.getInstance();

        um.initializeUserBalance(maker);
        um.initializeUserBalance(taker);

        um.lockUserBalance(maker, "USDC", scaled(makerMargin));
        obm.updateOrderBook(
            { userId: maker, qty, price, margin: makerMargin, side: "SHORT", type: "limit", market },
            scaled(qty), makerOrderId
        );
        um.addUserOrder(
            { userId: maker, qty, price, margin: makerMargin, side: "SHORT", type: "limit", market },
            makerOrderId, "open"
        );

        um.lockUserBalance(taker, "USDC", scaled(takerMargin));
        const remainQty = obm.matchOrder(
            { userId: taker, qty, price, margin: takerMargin, side: "LONG", type: "limit", market },
            takerOrderId
        );

        expect(remainQty).toBe(0n);

        const fills = obm.getUserFillsByUserId(taker);
        expect(fills).toBeDefined();
        expect(fills!.length).toBe(1);

        const makerPos = um.getUserPositionByMarket(maker, market);
        expect(makerPos).toBeDefined();
        expect(makerPos!.side).toBe("SHORT");

        const takerPos = um.getUserPositionByMarket(taker, market);
        expect(takerPos).toBeDefined();
        expect(takerPos!.side).toBe("LONG");
    });

    test("SHORT taker fills against LONG maker at same price", () => {
        const maker = freshId("maker");
        const taker = freshId("taker");
        const makerOrderId = freshId("mo");
        const takerOrderId = freshId("to");
        const market = "SOL";
        const price = "88";
        const qty = "10";
        const makerMargin = "1000";
        const takerMargin = "500";

        const um = UserManager.getInstance();
        const obm = OrderBookManager.getInstance();

        um.initializeUserBalance(maker);
        um.initializeUserBalance(taker);

        um.lockUserBalance(maker, "USDC", scaled(makerMargin));
        obm.updateOrderBook(
            { userId: maker, qty, price, margin: makerMargin, side: "LONG", type: "limit", market },
            scaled(qty), makerOrderId
        );
        um.addUserOrder(
            { userId: maker, qty, price, margin: makerMargin, side: "LONG", type: "limit", market },
            makerOrderId, "open"
        );

        um.lockUserBalance(taker, "USDC", scaled(takerMargin));
        const remainQty = obm.matchOrder(
            { userId: taker, qty, price, margin: takerMargin, side: "SHORT", type: "limit", market },
            takerOrderId
        );

        expect(remainQty).toBe(0n);

        const makerPos = um.getUserPositionByMarket(maker, market);
        expect(makerPos!.side).toBe("LONG");

        const takerPos = um.getUserPositionByMarket(taker, market);
        expect(takerPos!.side).toBe("SHORT");
    });

    test("multi-level matching: LONG walks up the ask ladder", () => {
        const taker = freshId("taker");
        const market = "SOL";

        const um = UserManager.getInstance();
        const obm = OrderBookManager.getInstance();
        um.initializeUserBalance(taker);

        const askPrices = ["66", "67", "68"];

        for (const askPrice of askPrices) {
            const m = freshId("maker");
            const mo = freshId("mo");
            um.initializeUserBalance(m);
            um.lockUserBalance(m, "USDC", scaled("250"));
            obm.updateOrderBook(
                { userId: m, qty: "5", price: askPrice, margin: "250", side: "SHORT", type: "limit", market },
                scaled("5"), mo
            );
            um.addUserOrder(
                { userId: m, qty: "5", price: askPrice, margin: "250", side: "SHORT", type: "limit", market },
                mo, "open"
            );
        }

        um.lockUserBalance(taker, "USDC", scaled("1500"));
        const remainQty = obm.matchOrder(
            { userId: taker, qty: "15", price: "68", margin: "1500", side: "LONG", type: "limit", market },
            freshId("to")
        );

        expect(remainQty).toBe(0n);

        const fills = obm.getUserFillsByUserId(taker);
        expect(fills).toBeDefined();
        expect(fills!.length).toBe(3);

        const takerPos = um.getUserPositionByMarket(taker, market);
        expect(takerPos!.qty).toBe(scaled("15"));
    });

    test("partial fill returns remaining qty correctly", () => {
        const maker = freshId("maker");
        const taker = freshId("taker");
        const mo = freshId("mo");
        const to = freshId("to");
        const market = "SOL";
        const price = "55";

        const um = UserManager.getInstance();
        const obm = OrderBookManager.getInstance();

        um.initializeUserBalance(maker);
        um.initializeUserBalance(taker);

        um.lockUserBalance(maker, "USDC", scaled("250"));
        obm.updateOrderBook(
            { userId: maker, qty: "5", price, margin: "250", side: "SHORT", type: "limit", market },
            scaled("5"), mo
        );
        um.addUserOrder(
            { userId: maker, qty: "5", price, margin: "250", side: "SHORT", type: "limit", market },
            mo, "open"
        );

        um.lockUserBalance(taker, "USDC", scaled("800"));
        const remainQty = obm.matchOrder(
            { userId: taker, qty: "8", price, margin: "800", side: "LONG", type: "limit", market },
            to
        );

        expect(remainQty).toBe(scaled("3"));

        const takerPos = um.getUserPositionByMarket(taker, market);
        expect(takerPos!.qty).toBe(scaled("5"));

        const makerOrder = um.getUserOrder(maker, mo);
        expect(makerOrder).toBeDefined();
    });
});
