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
    correlationId: string,
    ok: boolean,
    data?: unknown,
    error?: unknown
}