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

describe("OrderBookManager", () => {
    test("initializeOrderBooks creates books for all supported assets", () => {
        const obm = OrderBookManager.getInstance();
        const books = obm.getOrderbooks();
        expect(books.has("SOL")).toBe(true);
        expect(books.has("ETH")).toBe(true);
        expect(books.has("USDC")).toBe(true);
    });

    test("adds bid to orderbook at correct price level", () => {
        const uid = freshId("u");
        const oid = freshId("bid");
        UserManager.getInstance().initializeUserBalance(uid);
        OrderBookManager.getInstance().updateOrderBook(
            { userId: uid, qty: "5", price: "99", margin: "250", side: "LONG", type: "limit", market: "SOL" },
            scaled("5"), oid
        );
        const book = OrderBookManager.getInstance().getOrderbook("SOL")!;
        expect(book.bids.has(scaled("99"))).toBe(true);
    });

    test("adds ask to orderbook at correct price level", () => {
        const uid = freshId("u");
        const oid = freshId("ask");
        UserManager.getInstance().initializeUserBalance(uid);
        OrderBookManager.getInstance().updateOrderBook(
            { userId: uid, qty: "5", price: "151", margin: "250", side: "SHORT", type: "limit", market: "ETH" },
            scaled("5"), oid
        );
        const book = OrderBookManager.getInstance().getOrderbook("ETH")!;
        expect(book.asks.has(scaled("151"))).toBe(true);
    });

    test("throws when no asks available for market price (LONG)", () => {
        const obm = OrderBookManager.getInstance();
        expect(() => obm.getMarketPrice(freshId("u"), "0.05", "LONG", "BTC_NOT_EXIST"))
            .toThrow();
    });

    test("getBestPriceOfAsset returns SortedPrices for existing market", () => {
        const prices = OrderBookManager.getInstance().getBestPriceOfAsset("SOL");
        expect(prices).toBeDefined();
        expect(prices.bids).toBeDefined();
        expect(prices.asks).toBeDefined();
    });
});
