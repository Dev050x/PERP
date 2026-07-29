import type { EngineRequest } from "types/publisher";
import { RedisManager } from "../store/redis-manager";
import { getLatestSnapshotCached } from "./snanpshot";
import { handleEngineRequest } from "..";

export async function replayMissedMessages() {
    const latest = getLatestSnapshotCached();
    if (!latest?.offset) {
        console.log("no snapshot offset found, starting fresh");
        return;
    }

    const redisManager = RedisManager.getInstance();
    const missed = await redisManager.readMissedMessages(latest.offset);

    if (missed.length === 0) {
        console.log("no missed messages, up to date with snapshot");
        redisManager.setLastOffset(latest.offset);
        return;
    }

    console.log(`replaying ${missed.length} missed messages`);

    for (const entry of missed) {
        const raw_data = entry.message["message"];
        if (!raw_data) continue;

        const received_data: EngineRequest = JSON.parse(raw_data);
        try {
            const response_data = handleEngineRequest(received_data)!;
            redisManager.setLastOffset(entry.id);
            if (!response_data) continue;

            await redisManager.publishData({
                msg: received_data.msg,
                correlationId: received_data.correlationID,
                ok: true,
                data: response_data,
            });

        } catch (error) {
            console.log("error replaying message", entry.id, error);
            redisManager.setLastOffset(entry.id);
        }
    }

    console.log("replay complete, caught up to", redisManager.getLastOffset());
}