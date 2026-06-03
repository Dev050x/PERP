import type { Fill, Order, Position } from ".";
import type { EngineRequest } from "./publisher.type"

export type StreamMessage = {
    name: string,
    messages : {
        id: string,
        message: EngineRequest,
    }[],
};

export type FromStream = StreamMessage[];

export type EngineResponse = {
    msg?: string,
    correlationId: string,
    ok: boolean,
    data?: CreateOrderResponseData | any ,
    error?: unknown
}

type Stringify<T> = {
    [K in keyof T]: string
}

export type CreateOrderResponseData = {
    userId: string, 
    fills: Stringify<Fill>[],
    order: Stringify<Order>,
    position: Stringify<Position>,
    depth : {
        bids: [string, string][],
        asks: [string, string][]
    }
}