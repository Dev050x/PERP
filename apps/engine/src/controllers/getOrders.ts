import type { GetOpenOrdersData } from "types/publisher";
import { UserManager } from "../store/user-manager";
import type { Order } from "types";
import { SerializeData } from "../utils/serialize";

export function getOrders(data: GetOpenOrdersData) {
    const userOrders = UserManager.getInstance().getUserOrders(data.userId)!;
    const userAssetOrders:Record<string, string>[] = [];

    userOrders.forEach((order:Order, _orderId) => {
        if (order.market === data.marketId) {
            userAssetOrders.push(SerializeData(order));
        }
    });

    if (userAssetOrders.length === 0) {
        return {
            response: "user does not have any open position for this asset",
        }
    }
    return {
        orders: userAssetOrders,
    }

}   
