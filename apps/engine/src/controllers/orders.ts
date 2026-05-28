import type { CreateOrderData, EngineRequest } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializableUserBalances, SerializeData, serializeFills } from "../utils/serialize";
import { OrderBookManager } from "../store/orderbook-manager";
import { PRECISION, toBigInt, toString } from "../utils/conversion";
import type { OrderStatus, UserOrder } from "types";

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
        throw new Error("User don't have sufficient balance");
    }


    user_manager.lockUserBalance(user_order.userId, "USDC", toBigInt(user_order.margin, 6));
    const remainQty = orderbook_manager.matchOrder(user_order, orderId);
    console.log("remaining qty: ", remainQty);
    const filledQty = toBigInt(user_order.qty, PRECISION) - remainQty;
    console.log("filled qty:", filledQty);
    const status: OrderStatus = (filledQty === toBigInt(data.qty, PRECISION)) ? "Filled" : (filledQty === 0n ? "open" : "partiallyFilled");
    const fills = (status === "open" ? [] : orderbook_manager.getUserFillsByOrderId(orderId)!);
    if (status !== "Filled") {
        orderbook_manager.updateOrderBook(user_order, remainQty, orderId);
    }
    user_manager.addUserOrder(data, orderId, status);
    const order = SerializeData(user_manager.getUserOrder(data.userId, orderId)!);
    return {
        fills: serializeFills(fills),
        order,
    }
}

export function InitializeOrderBook(data: EngineRequest) {
    return OrderBookManager.getInstance().initializeOrderBooks();
}