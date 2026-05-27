import type { CreateOrderData, EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances, SerializeUserOrder } from "../utils/serialize";
import { OrderBookManager } from "../store/orderbook-manager";
import { PRECISION, toBigInt } from "../utils/conversion";
import type { UserOrder } from "types";

export function OnRamp(data: EngineRequest) {
    const user = UserManager.getInstance().createUser(data.data.userId);
    const userBalance = UserManager.getInstance().initializeUserBalance(data.data.userId);
    const serializeUserBalance = SerializableUserBalances(userBalance);
    return {
        userBalance: serializeUserBalance,
    }
}

export function CreateOrder(data: CreateOrderData) {
    console.log("data received: ", data);
    const user_manager = UserManager.getInstance();
    const orderbook_manager = OrderBookManager.getInstance();
    const orderId = crypto.randomUUID();
    const user_order: UserOrder = data;

    if (!user_manager.hasEnoughBalance(user_order.userId, toBigInt(user_order.margin, 6), "USDC")) {
        console.log("User don't have sufficient balance");
        throw new Error("User don't have sufficient balance");
    }

    user_manager.lockUserBalance(user_order.userId, "USDC", toBigInt(user_order.margin, 6));
    const filledQty = orderbook_manager.matchOrder(user_order);
    const remaingQty = toBigInt(user_order.qty, PRECISION) - filledQty;
    const status = (filledQty === 0n) ? "open" : "partiallyFilled";
    orderbook_manager.updateOrderBook(user_order, remaingQty, orderId);
    user_manager.addUserOrder(data, orderId, status)
    const order = SerializeUserOrder(user_manager.getUserOrder(data.userId, orderId)!);

    return {
        order,
    }
}

export function InitializeOrderBook(data: EngineRequest) {
    return OrderBookManager.getInstance().initializeOrderBooks();
}