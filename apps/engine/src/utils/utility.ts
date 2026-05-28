import type { OrderStatus } from "types";

export function resolveStatus(filledQty: bigint, totalQty: bigint): OrderStatus {
    if(filledQty === totalQty) return "Filled";
    else if(filledQty === 0n) return "open";
    else return "partiallyFilled";
}