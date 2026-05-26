import type LinkedList from "dbly-linked-list";
import type BTree from "sorted-btree";

export type Order = {
    orderId: string,
    userId: string,
    market: string,
    side: "LONG" | "SHORT",
    qty: bigint,
    margin: bigint,
    type: "limit" | "market",
    price: bigint,
    status: "open" | "partiallyFilled" | "Filled" | "Close"
};


export type orderbook = {
    bids: BTree<bigint, LinkedList>,
    asks: BTree<bigint, LinkedList>,
    lastTradedPrice: bigint,
    indexPrice: bigint,
};

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