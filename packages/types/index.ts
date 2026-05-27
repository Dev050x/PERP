import type LinkedList from "dbly-linked-list";
import type BTree from "sorted-btree";

export type OrderStatus = "open" | "partiallyFilled" | "Filled" | "Close";

export type Order = {
    orderId: string,
    userId: string,
    market: string,
    side: "LONG" | "SHORT",
    qty: bigint,
    margin: bigint,
    type: "limit" | "market",
    price: bigint,
    status: OrderStatus
};

export type RestingOrders = {
    availableQty: bigint,
    orders: LinkedList,     //type of Order
}

export type orderbook = {
    bids: Map<bigint, RestingOrders>,
    asks: Map<bigint, RestingOrders>,
    lastTradedPrice: bigint,
    indexPrice: bigint,
};

export type SortedPrices = {
    bids: BTree<bigint, bigint>, //price and qty
    asks: BTree<bigint, bigint>
}

export type BestPrices = BTree<string, SortedPrices>;

export type Position = {
    market: string,
    orderId: string,
    side: "LONG" | "SHORT",
    qty: bigint,
    margin: bigint,
    liquidationPrice: bigint,
    averagePrice: bigint,
};

export type UserDetails = {
    orders: Map<string, Order>,
    positions: Map<string, Position>
}

export type Fill = {
    makerId: string,
    takerId: string,
    LongUserId: string,
    ShortUserId: string,
    price: bigint,
    qty: BigIntConstructor,
    market: string,
};

export type UserBalance = {
    availableBalance: bigint,
    lockedBalance: bigint
}

export type UserOrder = {
    userId: string,
    qty: string,
    price?: string,
    margin: string,
    side: "LONG" | "SHORT",
    type: "limit" | "market",
    market: string,
}