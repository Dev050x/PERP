export type EngineRequest = OnRampType | CreateOrderType | InitializeOrderbookType | CancelOrderType | GetPositionType | GetOpenOrders;

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

export type GetOpenOrders = {
    msg: "GetOpenOrders",
    correlationID: string,
    data: GetOpenOrdersData,
}

export type GetOpenOrdersData = {
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
}

export type InitializeOrderbookType = {
    msg: "InitializeOrderBook",
    correlationID: string,
    data: {
        userId: string,
    }
}

