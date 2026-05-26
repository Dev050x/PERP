export type EngineRequest = OnRampType | CreateOrderType;

export type OnRampType = {
    msg: "OnRamp",
    correlationID: string,
    userId: string,
};

export type CreateOrderType = {
    msg: "CreateOrder",
    correlationID: string,
    userId: string,
    qty: string,
    price?: string,
    margin: string,
    side: "LONG" | "SHORT",
    type: "limit" | "market",
}

