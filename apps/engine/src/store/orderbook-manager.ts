import type { Fill, Order, orderbook, Position, SortedPrices, UserOrder } from "types";
import { supported_asset, UserManager } from "./user-manager";
import BTree from "sorted-btree";
import { PRECISION, toBigInt } from "../utils/conversion";
import { calculateMargin } from "../utils/calculation";
import LinkedList from "dbly-linked-list";

const temp = "divpatel";
export class OrderBookManager {
    private static instance: OrderBookManager;
    private orderbooks: Map<string, orderbook>;
    private bestPrices: Map<string, SortedPrices>;
    private Fills: Fill[];
    private fillsByUserId: Map<string, Fill[]>;
    private fillsByOrderId: Map<string, Fill[]>;


    private constructor() {
        this.orderbooks = new Map();
        this.Fills = [];
        this.bestPrices = new Map();
        this.fillsByOrderId = new Map();
        this.fillsByUserId = new Map();
        this.initializeOrderBooks();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new OrderBookManager();
        }
        return this.instance;
    }

    public getOrderbook(market: string) {
        if (!this.orderbooks.get(market)) {
            console.log("orderbook does not exist for this asset");
            throw new Error("orderbook does not exist for this asset");
        }
        return this.orderbooks.get(market);
    }

    public getBestPriceOfAsset(market: string) {
        if (!this.bestPrices.get(market)) {
            throw new Error("Best prices does not exist for this market");
        }
        return this.bestPrices.get(market);
    }

    public getFills() {
        return this.Fills;
    }

    public getOrderbooks() {
        return this.orderbooks;
    }

    public getBestPrices() {
        return this.bestPrices;
    }

    public getFillsByUserId() {
        return this.fillsByUserId;
    }

    public getFillsByOrderId() {
        return this.fillsByOrderId;
    }

    public getUserFillsByUserId(userId: string) {
        if (!this.fillsByUserId.get(userId)) throw new Error("Fills does not exist for this users");
        return this.fillsByUserId.get(userId);
    }

    public getUserFillsByOrderId(orderId: string) {
        if (!this.fillsByOrderId.get(orderId)) throw new Error("Fills does not exist for this order");
        return this.fillsByOrderId.get(orderId);
    }

    public getMarketPrice(userId: string, slippage: string, side: "LONG" | "SHORT", market: string) {
        const bestPrice = this.getBestPriceOfAsset(market)!;
        if (side == "LONG") {
            const bestAsks = bestPrice.asks;
            if (bestAsks.size === 0) {
                throw new Error("No sell order is available");
            }
            for (const [key, value] of bestAsks.entries()) {
                return key;
            }
        }
        if (side == "SHORT") {
            const bestBids = bestPrice.bids;
            if (bestBids.size === 0) {
                throw new Error("No buy order is available");
            }
            for (const [key, value] of bestBids.entries()) {
                return key;
            }
        }
    }

    public initializeOrderBooks() {
        for (const asset of supported_asset) {
            if (!this.orderbooks.get(asset)) {
                this.orderbooks.set(asset, {
                    bids: new Map(),
                    asks: new Map(),
                    lastTradedPrice: 0n,
                    markPrice: 0n
                });

                this.bestPrices.set(asset, {
                    bids: new BTree(),
                    asks: new BTree()
                });
            }
        };
        return [...this.orderbooks.keys()];
    }

    public setMarkPrice(asset: string, markPrice: bigint) {
        const asset_orderbook = this.getOrderbook(asset)!;
        asset_orderbook.markPrice = markPrice;
    }

    public addAsset(asset: string) {
        if (this.orderbooks.get(asset)) {
            throw new Error("orderbook already exists for this asset");
        }
        this.orderbooks.set(asset, {
            bids: new Map(),
            asks: new Map(),
            lastTradedPrice: 0n,
            markPrice: 0n
        });
    }

    public createFillforUser(fill: Fill, userId: string, orderId: string) {
        if (!this.fillsByUserId.get(userId)) {
            this.fillsByUserId.set(userId, []);
        }
        this.fillsByUserId.get(userId)?.push(fill);
        if (!this.fillsByOrderId.get(orderId)) {
            this.fillsByOrderId.set(orderId, []);
        }
        this.fillsByOrderId.get(orderId)?.push(fill);
    }

    public matchOrder(data: UserOrder, orderId: string): bigint {
        return (data.side === "LONG" ? this.matchLongOrder(data, orderId) : this.matchShortOrder(data, orderId));
    }

    public matchLongOrder(data: UserOrder, orderId: string): bigint {
        const orderbook = this.getOrderbook(data.market)!;
        const asks = orderbook.asks;
        const bestPrices = this.getBestPriceOfAsset(data.market)?.asks!;
        let qty = toBigInt(data.qty, PRECISION);
        const price = toBigInt(data.price!, PRECISION);
        let averagePrice = 0n;
        let prevQty = 0n;
        const sorted_prices = [...bestPrices.keys()];
        for (let i = 0; i < sorted_prices.length; i++) {
            const p = sorted_prices[i]!;
            // console.log("chaning price: ", p);
            if (p > price || qty === 0n) {
                break;
            }
            const ask = asks.get(p)!;
            const availableQty = ask.availableQty;
            const orders = ask.orders;

            while (!orders.isEmpty() && qty !== 0n) {
                // console.log("right now filling qty: ", qty);
                const order = orders.getHeadNode()?.getData()! as Order;
                const filledQty = order.qty > qty ? qty : order.qty;
                const fill = {
                    makerId: order.userId,
                    takerId: data.userId,
                    LongUserId: data.userId,
                    ShortUserId: order.userId,
                    price: p,
                    qty: filledQty,
                    market: data.market,
                    buyOrderId: orderId,
                    sellOrderId: order.orderId,
                };
                this.Fills.push(fill);
                this.createFillforUser(fill, order.userId, order.orderId);
                this.createFillforUser(fill, data.userId, orderId);
                ask.availableQty -= filledQty;
                bestPrices.set(p, bestPrices.get(p)! - filledQty);
                order.qty -= filledQty;
                qty -= filledQty;
                averagePrice = ((averagePrice * prevQty) + (filledQty * p)) / (prevQty + filledQty);
                prevQty = filledQty;

                //status(order)
                (order.qty === 0n ? order.status === "Filled" : order.status = "partiallyFilled");
                const user_order = UserManager.getInstance().getUserOrder(order.userId, order.orderId)!;
                user_order.status = order.status;

                UserManager.getInstance().createUserPosition(order.userId, p, data.market, filledQty, "SHORT", order.margin);

                (ask.availableQty === 0n ? asks.delete(p) : null);
                (bestPrices.get(p) === 0n ? bestPrices.delete(p) : null);
                (order.qty === 0n ? orders.removeFirst() : null);
                orderbook.lastTradedPrice = order.price;

            }
        }

        if (toBigInt(data.qty, PRECISION) !== qty) {
            UserManager.getInstance().createUserPosition(data.userId, averagePrice, data.market, toBigInt(data.qty, PRECISION) - qty, "LONG", toBigInt(data.margin, PRECISION));
        }
        return qty;
    }

    public matchShortOrder(data: UserOrder, orderId: string): bigint {
        const orderbook = this.getOrderbook(data.market)!;
        const bids = orderbook.bids;
        const bestPrices = this.getBestPriceOfAsset(data.market)?.bids!;
        let qty = toBigInt(data.qty, PRECISION);
        const price = toBigInt(data.price!, PRECISION);
        let averagePrice = 0n;
        let prevQty = 0n;

        for (const [p, q] of bestPrices.entriesReversed()) {
            if (p < price || qty === 0n) {
                break;
            }
            const bid = bids.get(p)!;
            const availableQty = bid.availableQty;
            const orders = bid.orders;

            while (orders.getHeadNode() && qty) {
                const order = orders.getHeadNode()?.getData()! as Order;
                const filledQty = order.qty > qty ? qty : order.qty;
                const fill = {
                    makerId: order.userId,
                    takerId: data.userId,
                    LongUserId: data.userId,
                    ShortUserId: order.userId,
                    price: p,
                    qty: filledQty,
                    market: data.market,
                    buyOrderId: order.orderId,
                    sellOrderId: orderId,
                };
                this.Fills.push(fill);
                this.createFillforUser(fill, order.userId, order.orderId);
                this.createFillforUser(fill, data.userId, orderId);
                bid.availableQty -= filledQty;
                bestPrices.set(p, bestPrices.get(p)! - filledQty);
                order.qty -= filledQty;
                qty -= filledQty;
                averagePrice = ((averagePrice * prevQty) + (filledQty * p)) / (prevQty + filledQty);
                prevQty = filledQty;

                //status(order)
                (order.qty === 0n ? order.status === "Filled" : order.status = "partiallyFilled");
                const user_order = UserManager.getInstance().getUserOrder(order.userId, order.orderId)!;
                user_order.status = order.status;
                console.log(`we're creating the position for user ${order.userId} at average price ${p} and qty ${filledQty} with margin ${order.margin}`);
                UserManager.getInstance().createUserPosition(order.userId, p, data.market, filledQty, "LONG", order.margin);

                (bid.availableQty === 0n ? bids.delete(p) : null);
                (bestPrices.get(p) === 0n ? bestPrices.delete(p) : null);
                (order.qty === 0n ? orders.removeFirst() : null);
                orderbook.lastTradedPrice = order.price;
            }

        }

        if (toBigInt(data.qty, PRECISION) !== qty) {
            console.log(`we're create the position for user ${data.userId} at average price ${averagePrice} and qty ${toBigInt(data.qty, PRECISION) - qty} with margin ${toBigInt(data.margin, PRECISION)}`);
            UserManager.getInstance().createUserPosition(data.userId, averagePrice, data.market, toBigInt(data.qty, PRECISION) - qty, "SHORT", toBigInt(data.margin, PRECISION));
        }

        return qty;
    }

    public cancelOrder(userId: string, orderId: string) {
        const order = UserManager.getInstance().getUserOrder(userId, orderId);
        if (!order) {
            throw new Error("Order does not exists");
        }
        (order.side === "LONG" ? this.cancelBid(order) : this.cancelAsk(order));
    }

    public cancelBid(order: Order) {
        const bids = OrderBookManager.getInstance().getOrderbook(order.market)!.bids;
        const bestPrices = this.getBestPriceOfAsset(order.market)!.bids;

        const bid = bids.get(order.price)!;
        const index = bid.orders.indexOf(order);
        if (index !== -1) {
            bid.orders.removeAt(index);
            bid.availableQty -= order.qty;
            bid.availableQty === 0n ? bids.delete(order.price) : null;

            bestPrices.set(order.price, bestPrices.get(order.price)! - order.qty!);
            (bestPrices.get(order.price) === 0n ? bestPrices.delete(order.price) : null);

            const userDetail = UserManager.getInstance().getUser(order.userId)!;
            userDetail.orders.get(order.orderId)!.status = "Cancel";
            const userAssetBalance = UserManager.getInstance().getUserBalances(order.userId)!["USDC"]!;
            userAssetBalance.availableBalance += order.margin;
            userAssetBalance.lockedBalance -= order.margin;
        }
    }

    public cancelAsk(order: Order) {
        const asks = OrderBookManager.getInstance().getOrderbook(order.market)!.asks;
        const bestPrices = this.getBestPriceOfAsset(order.market)!.asks;

        const ask = asks.get(order.price)!;
        const index = ask.orders.indexOf(order);
        if (index !== -1) {
            ask.orders.removeAt(index);
            ask.availableQty -= order.qty;
            ask.availableQty === 0n ? asks.delete(order.price) : null;

            bestPrices.set(order.price, bestPrices.get(order.price)! - order.qty!);
            (bestPrices.get(order.price) === 0n ? bestPrices.delete(order.price) : null);

            const userDetail = UserManager.getInstance().getUser(order.userId)!;
            userDetail.orders.get(order.orderId)!.status = "Cancel";
            const userAssetBalance = UserManager.getInstance().getUserBalances(order.userId)!["USDC"]!;
            userAssetBalance.availableBalance += order.margin;
            userAssetBalance.lockedBalance -= order.margin;
        }
    }

    public updateOrderBook(data: UserOrder, remainQty: bigint, orderId: string) {
        return (data.side === "LONG" ? this.updateBids(data, remainQty, orderId) : this.updateAsks(data, remainQty, orderId));
    }

    public updateBids(data: UserOrder, remaingQty: bigint, orderId: string) {
        const bids = this.getOrderbook(data.market)!.bids!;
        const bestPrices = this.getBestPriceOfAsset(data.market)!.bids!;
        const price = toBigInt(data.price!, PRECISION);
        const initialQty = toBigInt(data.qty, PRECISION);
        const bid = bids.get(price);
        const newOrder = {
            orderId,
            userId: data.userId,
            market: data.market,
            side: "LONG",
            qty: remaingQty,
            margin: calculateMargin(initialQty, remaingQty, toBigInt(data.margin, PRECISION)),
            type: "limit",
            price: price,
            status: initialQty === remaingQty ? "open" : "partiallyFilled"
        };

        if (bid && bestPrices.get(price)) {
            bid.availableQty += remaingQty;
            bid.orders.insert(newOrder);
            bestPrices.set(price, bestPrices.get(price)! + remaingQty);
        } else {
            const orders = new LinkedList();
            const addOrder = orders.insert(newOrder);
            bids.set(price, {
                availableQty: remaingQty,
                orders,
            });
            bestPrices.set(price, remaingQty);
        }
        // console.log("orderbook: ", this.orderbooks.get(data.market));

        this.getOrderbook(data.market)?.bids.forEach(bid => {
            // console.log("total qty; ", bid.availableQty);
            // console.log("orders: ", bid.orders.toArray());
        })

    }

    public updateAsks(data: UserOrder, remaingQty: bigint, orderId: string) {
        const asks = this.getOrderbook(data.market)!.asks!;
        const bestPrices = this.getBestPriceOfAsset(data.market)!.asks!;
        const price = toBigInt(data.price!, PRECISION);
        const initialQty = toBigInt(data.qty, PRECISION);
        const ask = asks.get(price);
        const newOrder = {
            orderId,
            userId: data.userId,
            market: data.market,
            side: "SHORT",
            qty: remaingQty,
            margin: calculateMargin(initialQty, remaingQty, toBigInt(data.margin, PRECISION)),
            type: "limit",
            price: price,
            status: initialQty === remaingQty ? "open" : "partiallyFilled"
        };

        if (ask && bestPrices.get(price)) {
            ask.availableQty += remaingQty;
            ask.orders.insert(newOrder);
            bestPrices.set(price, bestPrices.get(price)! + remaingQty);
        } else {
            const orders = new LinkedList();
            const addOrder = orders.insert(newOrder);
            asks.set(price, {
                availableQty: remaingQty,
                orders,
            });
            bestPrices.set(price, remaingQty);
        }
    }

}
