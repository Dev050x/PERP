import type { CancelOrderData } from "types/publisher";
import { OrderBookManager } from "../store/orderbook-manager";
import { UserManager } from "../store/user-manager";
import { SerializeData } from "../utils/serialize";
import { getDepth } from "./get-depth";

export function CancelOrder(data: CancelOrderData) {
    const orderbookManager = OrderBookManager.getInstance();
    const userManager = UserManager.getInstance();
    const market = userManager.getUserOrder(data.userId, data.orderId)!.market;
    orderbookManager.cancelOrder(data.userId, data.orderId);
    const order = SerializeData(userManager.getUserOrder(data.userId, data.orderId)!);
    const depth = getDepth(market);
    return {
        order,
        depth
    }
}