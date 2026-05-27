import type { Fill, orderbook, SortedPrices, UserOrder } from "types";
import { supported_asset } from "./user-manager";
import BTree from "sorted-btree";
import { PRECISION, toBigInt } from "../utils/conversion";
import { calculateMargin } from "../utils/calculation";
import LinkedList from "dbly-linked-list";


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

    public getBestPrices(market: string) {
        if (!this.bestPrices.get(market)) {
            throw new Error("Best prices does not exist for this market");
        }
        return this.bestPrices.get(market);
    }

    public getFills() {
        return this.Fills;
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

    public matchOrder(data: UserOrder): bigint {
        return (data.side === "LONG" ? this.matchLongOrder(data) : this.matchShortOrder(data));
    }

    public matchLongOrder(data: UserOrder): bigint {
        return 0n;
    }

    public matchShortOrder(data: UserOrder): bigint {
        return 0n;
    }

    public updateOrderBook(data: UserOrder, remainQty: bigint, orderId: string) {
        return (data.side === "LONG" ? this.updateBids(data, remainQty, orderId) : this.updateAsks(data, remainQty, orderId));
    }

    public updateBids(data: UserOrder, remaingQty: bigint, orderId: string) {
        const bids = this.getOrderbook(data.market)!.bids!;
        const bestPrices = this.getBestPrices(data.market)!.bids!;
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
            console.log("hello");
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
            bestPrices.set(price,remaingQty);
        }
        console.log("orderbook: ", this.orderbooks.get(data.market));

        this.getOrderbook(data.market)?.bids.forEach(bid => {
            console.log("total qty; ", bid.availableQty);
            console.log("orders: ", bid.orders.toArray());
        })

    }

    public updateAsks(data: UserOrder, remaingQty: bigint, orderId: string) {
        const asks = this.getOrderbook(data.market)!.asks!;
        const bestPrices = this.getBestPrices(data.market)!.asks!;
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
            })
        }
    }

}