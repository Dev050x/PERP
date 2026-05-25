export type ToEngine = OnRampType | CreateOrderType;

export type OnRampType = {
    msg: "Onramp",
    userId: string,
};

export type CreateOrderType = {
    msg: "CreateOrder",
    userId: string,
    qty: string,
    price?: string,
    margin: string,
    side: "LONG" | "SHORT",
    type: "limit" | "market"
}

