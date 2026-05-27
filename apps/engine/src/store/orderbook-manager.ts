import type { Fill, Order, orderbook, Position, SortedPrices, UserOrder } from "types";
import { supported_asset, UserManager } from "./user-manager";
import BTree from "sorted-btree";
import { PRECISION, toBigInt } from "../utils/conversion";
import { calculateMargin } from "../utils/calculation";
import LinkedList from "dbly-linked-list";

//this is comment dont by divpatel while learing conversion
const temp = "divpatel";
export class OrderBookManager {
    private static instance: OrderBookManager;
    private orderbooks: Map<string, orderbook>;
    private bestPrices: Map<string, SortedPrices>;
    private Fills: Fill[];


    private constructor() {
        this.orderbooks = new Map();
        this.Fills = [];
        this.bestPrices = new Map();
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

    public initializeOrderBooks() {
        for (const asset of supported_asset) {
            if (!this.orderbooks.get(asset)) {
                this.orderbooks.set(asset, {
                    bids: new Map(),
                    asks: new Map(),
                    lastTradedPrice: 0n,
                    indexPrice: 0n
                });

                this.bestPrices.set(asset, {
                    bids: new BTree(),
                    asks: new BTree()
                });
            }
        };
        return [...this.orderbooks.keys()];
    }

    public addAsset(asset: string) {
        if (this.orderbooks.get(asset)) {
            throw new Error("orderbook already exists for this asset");
        }
        this.orderbooks.set(asset, {
            bids: new Map(),
            asks: new Map(),
            lastTradedPrice: 0n,
            indexPrice: 0n
        });
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
        let averagePrice = 1n;
        let prevQty = 1n;
        const sorted_prices = [...bestPrices.keys()];
        for(let i=0; i < sorted_prices.length; i++){
            const p = sorted_prices[i]!;
            console.log("chaning price: ", p);
            if (p > price || qty === 0n) {
                break;
            }
            const ask = asks.get(p)!;
            const availableQty = ask.availableQty;
            const orders = ask.orders;

            while (!orders.isEmpty() && qty !== 0n) {
                console.log("right now filling qty: ", qty);
                const order = orders.getHeadNode()?.getData()! as Order;
                const filledQty = order.qty > qty ? qty : order.qty;
                this.Fills.push({
                    makerId: order.userId,
                    takerId: data.userId,
                    LongUserId: data.userId,
                    ShortUserId: order.userId,
                    price: p,
                    qty: filledQty,
                    market: data.market,
                });
                ask.availableQty -= filledQty;
                bestPrices.set(p, bestPrices.get(p)! - filledQty);
                order.qty -= filledQty;
                qty -= filledQty;

                //status(order)
                (order.qty === 0n ? order.status === "Filled" : order.status = "partiallyFilled");
                const user_order = UserManager.getInstance().getUserOrder(order.userId, order.orderId)!;
                user_order.status = order.status;
                UserManager.getInstance().createUserPosition(order.userId, p, data.market, filledQty, "SHORT", order.margin);

                (ask.availableQty === 0n ? asks.delete(p) : null);
                (bestPrices.get(p) === 0n ? bestPrices.delete(p) : null);
                (order.qty === 0n ? orders.removeFirst() : null);
                 console.log("After filling qty", qty);

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
        let averagePrice = 1n;
        let prevQty = 1n;

        for (const [p, q] of bestPrices.entriesReversed()) {
            console.log("chaning price: ", p);
            if (p < price || qty === 0n) {
                break;
            }
            const bid = bids.get(p)!;
            const availableQty = bid.availableQty;
            const orders = bid.orders;

            while (orders.getHeadNode() && qty) {
                console.log("Now filling Qty ", qty);
                const order = orders.getHeadNode()?.getData()! as Order;
                const filledQty = order.qty > qty ? qty : order.qty;
                this.Fills.push({
                    makerId: order.userId,
                    takerId: data.userId,
                    LongUserId: data.userId,
                    ShortUserId: order.userId,
                    price: p,
                    qty: filledQty,
                    market: data.market,
                });
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
                UserManager.getInstance().createUserPosition(order.userId, p, data.market, filledQty, "LONG", order.margin);

                (bid.availableQty === 0n ? bids.delete(p) : null);
                (bestPrices.get(p) === 0n ? bestPrices.delete(p) : null);
                (order.qty === 0n ? orders.removeFirst() : null);
                console.log("After filling qty", qty);
            }

        }

        if (toBigInt(data.qty, PRECISION) !== qty) {
            UserManager.getInstance().createUserPosition(data.userId, averagePrice, data.market, toBigInt(data.qty, PRECISION) - qty, "SHORT", toBigInt(data.margin, PRECISION));
        }

        return qty;
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
            margin: calculateMargin(initialQty, remaingQty, price),
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
        console.log("orderbook: ", this.orderbooks.get(data.market));

        this.getOrderbook(data.market)?.bids.forEach(bid => {
            console.log("total qty; ", bid.availableQty);
            console.log("orders: ", bid.orders.toArray());
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
            margin: calculateMargin(initialQty, remaingQty, price),
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
