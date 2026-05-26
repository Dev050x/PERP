import type { EngineResponse } from "types/receiver";

interface pendingResponses {
    resolve: (value: EngineResponse) => void,
    reject: (error: Error) => void,
    timeout: ReturnType<typeof setTimeout>,
}

const pendingResponses = new Map<string, pendingResponses>();

export function waitForEngineResponse(correlationId: string, timeOutMs: number):Promise<EngineResponse> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject("Engine Response Time OUt");
        }, timeOutMs);

        pendingResponses.set(correlationId, {
            resolve,
            reject,
            timeout
        });
    })
};

export function resolvePromise(response: EngineResponse) {
    const pending = pendingResponses.get(response.correlationId);
    if(!pending) return;
    clearTimeout(pending.timeout);
    pendingResponses.delete(response.correlationId);
    pending.resolve(response);
}

