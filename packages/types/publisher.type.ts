export type EngineRequest = OnRampType | CreateOrderType | InitializeOrderbookType | CancelOrderType | GetPositionType | GetOpenOrders | GetOrders | GetFills | MarkPriceType;

export type OnRampType = {
    msg: "OnRamp",
    correlationID: string,
    data: {
        userId: string,
    }
};

export type CreateOrderType = {
    msg: "CreateOrder",
    correlationID: string,
    data: CreateOrderData,
}

export type CancelOrderType = {
    msg: "CancelOrder",
    correlationID: string,
    data: CancelOrderData
}

export type CancelOrderData = {
    userId: string,
    orderId: string,
}

export type GetPositionType = {
    msg: "GetPosition",
    correlationID: string,
    data: GetPositionData
}

export type GetPositionData = {
    userId: string,
    marketId: string,
}

export type GetOrders = {
    msg: "GetOrders",
    correlationID: string,
    data: GetOpenOrdersData,
}

export type GetOpenOrders = {
    msg: "GetOpenOrders",
    correlationID: string,
    data: GetOpenOrdersData,
}

export type GetOpenOrdersData = {
    userId: string,
    marketId: string
}

export type GetFills = {
    msg: "GetFills",
    correlationID: string,
    data: GetFillsData
}

export type GetFillsData = {
    userId: string,
}

export type GetOrdersData = {
    userId: string,
    marketId: string
}

export type CreateOrderData = {
    userId: string,
    qty: string,
    price?: string,
    margin: string,
    side: "LONG" | "SHORT",
    type: "limit" | "market",
    market: string,
    slippage?: string,
}

export type InitializeOrderbookType = {
    msg: "InitializeOrderBook",
    correlationID: string,
    data: {
        userId: string,
    }
}

export type MarkPriceType = {
    msg: "MarkPrice",
    correlationID: string
    data: MarkPriceData
}

export type MarkPriceData = {
    prices: StreamData[]
    userId: string,
}

export interface StreamData {
    e: string,
    E: number,
    s: string,
    p: string,
    ap: string,
    i: string,
    P: string,
    r: string,
    T: number
}