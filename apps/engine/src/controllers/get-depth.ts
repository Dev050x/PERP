import type { GetDepthData } from "types/publisher"
import { OrderBookManager } from "../store/orderbook-manager"
import { PRECISION, toString } from "../utils/conversion";

interface Depth {
    bids: [string, string][];
    asks: [string, string][];
}

export function getDepth(market: string) {
    const bestPrices = OrderBookManager.getInstance().getBestPriceOfAsset(market);
    const depth: Depth = {
        bids: [],
        asks: []
    };
    const bids = bestPrices?.bids;
    const asks = bestPrices?.asks;
    if (bids) {
        for (const [price, qty] of bids.entries()) {
            depth.bids.push([toString(price), toString(qty)]);
        }
    }
    if (asks) {
        for (const [price, qty] of asks.entries()) {
            depth.asks.push([toString(price), toString(qty)]);
        }
    }

    return {
        depth: depth,
        market: market,
    };
}