import path from "path";
import { LiquidationManager } from "../store/liquidation-manager";
import { OrderBookManager } from "../store/orderbook-manager";
import { UserManager } from "../store/user-manager";
import fs from "fs";
import { RedisManager } from "../store/redis-manager";

const SNAPSHOT_INTERVAL = 5000;

export function snapshot() {
    setInterval(() => {
        const userManager = UserManager.getInstance();
        const orderBookManager = OrderBookManager.getInstance();
        const liquidationManager = LiquidationManager.getInstance();
        const snapshot = {
            balances: Array.from(userManager.getBalances()),
            users: Array.from(userManager.getUsers()),
            orderbook: Array.from(orderBookManager.getOrderbooks()),
            bestPrices: Array.from(orderBookManager.getBestPrices()),
            fills: orderBookManager.getFills(),
            fillsByUserId: Array.from(orderBookManager.getFillsByUserId()),
            fillsByOrderId: Array.from(orderBookManager.getFillsByOrderId()),
            liquidationLongs: Array.from(liquidationManager.getLongLiquidation()),
            liquidationShorts: Array.from(liquidationManager.getShortLiquidation())
        }
        fs.writeFileSync(path.join(`${process.cwd()}/src/snapshots`, `snapshot-${RedisManager.getInstance().getLastOffset()}.json`), JSON.stringify(snapshot, (_, value) => {
            return (typeof value === "bigint" ? `${value}n` : value);
        }));

    }, SNAPSHOT_INTERVAL);

}