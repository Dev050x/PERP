import type { GetFillsData } from "types/publisher";
import { OrderBookManager } from "../store/orderbook-manager";
import { serializeFills } from "../utils/serialize";

export function getFill(data: GetFillsData) {
    const orderbookManager = OrderBookManager.getInstance();
    const fills = orderbookManager.getUserFillsByUserId(data.userId);
    if(!fills) {
        return {
            msg: "fills does not exist for the user"
        }
    };
    return {
        fills: serializeFills(fills),
    }
}