import { SerializableUserBalances, SerializeData, serializeFills } from "../utils/serialize";
import type { CancelOrderData, CreateOrderData, EngineRequest } from "types/publisher";
import { PRECISION, toBigInt, toString } from "../utils/conversion";
import { OrderBookManager } from "../store/orderbook-manager";
import type { OrderStatus, UserOrder } from "types";
import { UserManager } from "../store/user-manager";
import { resolveStatus } from "../utils/utility";
import { getDepth } from "./get-depth";


export function CreateOrder(data: CreateOrderData) {
    const orderbookManager = OrderBookManager.getInstance();
    const userManager = UserManager.getInstance();
    const userOrder: UserOrder = data;
    const orderId = crypto.randomUUID();
    if (data.type === "market") {
        data.price = toString(orderbookManager.getMarketPrice(data.userId, data.slippage!, data.side, data.market)!);
    }

    if (!userManager.hasEnoughBalance(userOrder.userId, toBigInt(userOrder.margin, 6), "USDC")) {
        throw new Error("Insufficient Balance");
    }
    userManager.lockUserBalance(userOrder.userId, "USDC", toBigInt(userOrder.margin, 6));

    const remainQty = orderbookManager.matchOrder(userOrder, orderId);
    const filledQty = toBigInt(userOrder.qty, PRECISION) - remainQty;
    const status: OrderStatus = resolveStatus(filledQty, toBigInt(data.qty, PRECISION));
    const fills = (status === "open" ? [] :  orderbookManager.getUserFillsByOrderId(orderId)!);
    let position = userManager.getUserPositionByMarket(userOrder.userId, userOrder.market);

    if (status !== "Filled") {
        orderbookManager.updateOrderBook(userOrder, remainQty, orderId);
    }

    userManager.addUserOrder(data, orderId, status);
    const order = userManager.getUserOrder(data.userId, orderId)!;
    const depth = getDepth(data.market);

    return {
        userId: userOrder.userId,
        fills: serializeFills(fills),
        order: SerializeData(order),
        position: position ? SerializeData(position) : "",
        depth,
    }
}

export function InitializeOrderBook(data: EngineRequest) {
    return OrderBookManager.getInstance().initializeOrderBooks();
}



