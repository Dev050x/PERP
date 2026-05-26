import type { Fill, orderbook } from "types";
import { supported_asset } from "./UserManager";
import BTree from "sorted-btree";


export class OrderBookManager {
    private static instance: OrderBookManager;
    private orderbooks: Map<string, orderbook>;
    private Fills: Fill[];


    private constructor() {
        this.orderbooks = new Map();
        this.Fills = [];
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new OrderBookManager();
        }
        return this.instance;
    }

    public getOrderbook(market: string) {
        return this.orderbooks.get(market);
    }

    public getFills() {
        return this.Fills;
    }

    public initializeOrderBooks() {
        for (const asset of supported_asset) {
            if (!this.orderbooks.get(asset)) {
                this.orderbooks.set(asset, {
                    bids: new BTree(),
                    asks: new BTree(),
                    lastTradedPrice: 0n,
                    indexPrice: 0n
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
            bids: new BTree(),
            asks: new BTree(),
            lastTradedPrice: 0n,
            indexPrice: 0n
        });
    }

}