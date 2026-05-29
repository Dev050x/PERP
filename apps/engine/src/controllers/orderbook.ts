import { SerializableUserBalances, SerializeData, serializeFills } from "../utils/serialize";
import type { CancelOrderData, CancelOrderType, CreateOrderData, EngineRequest, GetPositionData } from "types/publisher";
import { PRECISION, toBigInt, toString } from "../utils/conversion";
import { OrderBookManager } from "../store/orderbook-manager";
import type { OrderStatus, UserOrder } from "types";
import { UserManager } from "../store/user-manager";
import { resolveStatus } from "../utils/utility";

export function OnRamp(data: EngineRequest) {
    const userBalance = UserManager.getInstance().initializeUserBalance(data.data.userId);
    const serializeUserBalance = SerializableUserBalances(userBalance);
    return {
        userBalance: serializeUserBalance,
    }
}

export function CreateOrder(data: CreateOrderData) {
    const orderbookManager = OrderBookManager.getInstance();
    const userManager = UserManager.getInstance();
    const userOrder: UserOrder = data;
    const orderId = crypto.randomUUID();
    if(data.type === "market")  {
        data.price = toString(orderbookManager.getMarketPrice(data.userId, data.slippage!, data.side, data.market)!);
    }

    if (!userManager.hasEnoughBalance(userOrder.userId, toBigInt(userOrder.margin, 6), "USDC")) {
        throw new Error("Insufficient Balance");
    }
    userManager.lockUserBalance(userOrder.userId, "USDC", toBigInt(userOrder.margin, 6));

    const remainQty = orderbookManager.matchOrder(userOrder, orderId);
    const filledQty = toBigInt(userOrder.qty, PRECISION) - remainQty;
    const status: OrderStatus = resolveStatus(filledQty, toBigInt(data.qty, PRECISION));
    const fills = (status === "open" ? [] : orderbookManager.getUserFillsByOrderId(orderId)!);

    if (status !== "Filled") {
        orderbookManager.updateOrderBook(userOrder, remainQty, orderId);
    }

    userManager.addUserOrder(data, orderId, status);
    const order = SerializeData(userManager.getUserOrder(data.userId, orderId)!);

    return {
        fills: serializeFills(fills),
        order,
    }
}

export function CancelOrder(data: CancelOrderData) {
    const orderbookManager = OrderBookManager.getInstance();
    const userManager = UserManager.getInstance();
    orderbookManager.cancelOrder(data.userId, data.orderId);
    const order = SerializeData(userManager.getUserOrder(data.userId, data.orderId)!);
    return {
        order,
    }
}

export function InitializeOrderBook(data: EngineRequest) {
    return OrderBookManager.getInstance().initializeOrderBooks();
}



