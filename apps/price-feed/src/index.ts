import "dotenv/config";
import { WebSocket } from "ws";
import { RedisManager } from "./RedisMananger";
import type { EngineRequest } from "types/publisher";
export const supported_asset = ["SOL", "ETH"];

interface StreamData {
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

function getPriceFromBinanceStream() {
    const url = process.env.STREAM_URL;
    console.log("url is: ", url);
    const wss = new WebSocket(`${url}`);
    wss.on("open", () => {
        console.log("connection estalished with the binance stream");
    })
    wss.on("error", (error) => {
        console.log("there is some error while connecting to binance stream");
    })
    wss.on("message", (data) => {
        const streamData = JSON.parse(data.toString());
        const engineReq: EngineRequest = {
            msg: "MarkPrice",
            correlationID: "exchange-mark-price",
            data: {
                prices: streamData,
                userId: "exchange-mark-price",
            }
        };
        RedisManager.getInstance().publish(engineReq);
    })
}

getPriceFromBinanceStream();