import { OrderBookManager } from "../store/orderbook-manager";
import { UserManager } from "../store/user-manager";

function fundingRateDispersal() {
    const userManager = UserManager.getInstance();
    const users = userManager.getUsers();
    for (const userId of users.keys()) {
        const user_position = userManager.getUserPositions(userId);
        for (const [asset, position] of user_position) {
            const orderbook = OrderBookManager.getInstance().getOrderbook(asset)!;
            const inflationRate = (orderbook.lastTradedPrice - orderbook.markPrice) / orderbook.markPrice;

            const notionalValue = position.qty * orderbook.lastTradedPrice;
            if (inflationRate > 0n) {
                if (position.side === "LONG") {
                    position.margin = position.margin - notionalValue * inflationRate;
                } else {
                    position.margin = position.margin + notionalValue * inflationRate;
                }
            } else {
                if (position.side === "LONG") {
                    position.margin = position.margin + notionalValue * inflationRate;
                } else {
                    position.margin = position.margin - notionalValue * inflationRate;
                }
            }
        }
    }
}

export function fundingRate() {
    setInterval(() => {
        fundingRateDispersal();
    }, 1000 * 60 * 60);
}
