import type { Position } from "types";
import { PRECISION } from "./conversion";

const SCALE = 10n ** BigInt(PRECISION);

export function calculateMargin(initialQty: bigint, remainQty: bigint, margin: bigint): bigint {
    return (remainQty * margin) / initialQty;
}

export function getStatus(initialQty: bigint, remainQty: bigint): "open" | "partiallyFilled" {
    if (initialQty === remainQty) {
        return "partiallyFilled";
    }
    return "open";
}

export function calculateLiquidationPrice(price: bigint, qty: bigint, margin: bigint, side: "LONG" | "SHORT") {
    console.log(`price ${price} qty: ${qty} margin: ${margin} side: ${side}`);
    if (side === "LONG") {
        return ((price * qty) - (margin * SCALE)) / qty;
    } else {
        return ((price * qty) + (margin * SCALE)) / qty;
    }
}

export function calculateAveragePrice(prevPrice: bigint, prevQty: bigint, price: bigint, qty: bigint) {
    return ((prevPrice * prevQty) * (qty * price)) / (prevQty + qty);
}

export function calculateUnrealPnl(pos: Position, price: bigint) {
    if (pos.side === "LONG") {
        return (price - pos.averagePrice) * pos.qty;
    } else {
        return (pos.averagePrice - price) * pos.qty;
    }
}