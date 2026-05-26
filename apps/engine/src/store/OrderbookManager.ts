import type { Fill, orderbook } from "types";


export class OrderBookManager {
    private static instance: OrderBookManager;
    private orderbooks: Map<string, orderbook>;
    private Fills: Fill[];


    private constructor() {
        this.orderbooks = new Map();
        this.Fills = [];
    }

    public static getInstance() {
        if(!this.instance){
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
}