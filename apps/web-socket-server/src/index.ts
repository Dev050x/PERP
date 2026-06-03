import WebSocket, { WebSocketServer } from "ws";
import { RedisManager } from "./redis-manager";
import type { EngineResponse } from "types/receiver";

const ws = new WebSocketServer({
    port: 3001
});

interface Users {
    market: string,
    socket: WebSocket,
    id: string
}

const sockets: Users[] = [];

interface Depth {
    [market: string]: {
        bids: [string, string][],
        asks: [string, string][],
    }
}

let depth: Depth = {};

ws.on("connection", (socket) => {
    socket.on("message", (msg) => {
        const parsed_msg = JSON.parse(msg.toString());
        console.log("msg: ", parsed_msg);
        if (parsed_msg.method === "SUBSCRIBE") {
            sockets.push({
                market: parsed_msg.params[0],
                socket: socket,
                id: parsed_msg.id,
            });
            createInterval();
        }
        if (parsed_msg.msg === "UNSUBSCRIBE") {
            const index = sockets.findIndex(socket => socket.id === parsed_msg.id);
            sockets.splice(index, 1);
        }
    })
});

function createInterval() {
    setInterval(() => {
        sockets.forEach((socket) => {
            sockets.forEach(s => {
                s.socket.send(JSON.stringify(
                    {
                        market: s.market,
                        depth: {
                            bids: depth[s.market]?.bids,
                            asks: depth[s.market]?.asks
                        }
                    }
                ));
            })
        })
    }, 3000);
}


function handleResponse(data: EngineResponse) {
    if (data.msg === "GetDepth") {
        let depth_data = data.data.depth;
        let market = data.data.market as string;
        depth[market] = {
            bids: depth_data.bids,
            asks: depth_data.asks,
        }
    }
    else if (data.msg === "CreateOrder") {
        let depth_data = data.data.depth.depth;
        let market = data.data.order.market;
        console.log("depth data", depth_data);

        depth[market] = {
            bids: depth_data.bids,
            asks: depth_data.asks,
        }

    } else if (data.msg === "CancelOrder") {
        let depth_data = data.data.depth;
        let market = data.data.order.market;
        
        depth[market] = {
            bids: depth_data.bids,
            asks: depth_data.asks,
        }
    }
}

const redisManager = RedisManager.getInstance();

for (; ;) {
    const item = await redisManager.readMesage();
    const raw_data = item?.[0]?.messages?.[0]?.message["message"];
    if (!raw_data) continue;
    const data = JSON.parse(raw_data) as EngineResponse;
    handleResponse(data);
};