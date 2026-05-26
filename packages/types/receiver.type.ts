import type { EngineRequest } from "./publisher.type"

export type FromEngine = {
    name: string,
    messages : {
        id: string,
        message: EngineRequest,
    }[],
};

export type EngineRespose = {
    correlationId: string,
    ok: boolean,
    data: unknown
}