export function calculateMargin(initialQty: bigint, remainQty: bigint, price: bigint): bigint {
    return (remainQty * price) / initialQty;
}

export function getStatus(initialQty: bigint, remainQty: bigint): "open" | "partiallyFilled" {
    if(initialQty === remainQty) {
        return "partiallyFilled";
    }
    return "open";
}
