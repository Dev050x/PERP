import type { Position } from "types";

export function calculateMargin(initialQty: bigint, remainQty: bigint, price: bigint): bigint {
    return (remainQty * price) / initialQty;
}

export function getStatus(initialQty: bigint, remainQty: bigint): "open" | "partiallyFilled" {
    if (initialQty === remainQty) {
        return "partiallyFilled";
    }
    return "open";
}

export function calculateLiquidationPrice(price: bigint, qty: bigint, margin: bigint, side: "LONG" | "SHORT") {
    if (side === "LONG") {
        return (((price * qty) / 1000000n) - margin) / qty ;
    } else {
        return (((price * qty) / 100000n) + margin) / qty;
    }
}

export function calculateAveragePrice(prevPrice: bigint, prevQty: bigint, price: bigint, qty: bigint) {
    return ((prevPrice * prevQty) * (qty * price)) / (prevQty + qty);
}

export function calculateUnrealPnl(pos: Position, price: bigint) {
    if(pos.side === "LONG") {
        return (price - pos.averagePrice) * pos.qty;
    }else {
        return (pos.averagePrice - price) * pos.qty;
    }
}