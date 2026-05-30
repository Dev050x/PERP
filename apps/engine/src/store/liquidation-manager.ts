    import BTree from "sorted-btree";
    import { supported_asset, UserManager } from "./user-manager";

    export class LiquidationManager {
        private static instance: LiquidationManager;
        private liquidationLongs: Map<string, BTree<bigint, Set<string>>>;       //liquidation price and userId(we need to liquidate user position at this price)
        private liquidationShorts: Map<string, BTree<bigint, Set<string>>>;      //liquidation price and userId

        private constructor() {
            this.liquidationLongs = new Map();
            this.liquidationShorts = new Map();
            this.initializeLiquidation();
        }

        public static getInstance() {
            //helloo
            if (!this.instance) {
                this.instance = new LiquidationManager();
            }
            return this.instance;
        }

        public getLongLiquidation() {
            return this.liquidationLongs;
        }

        public getShortLiquidation() {
            return this.liquidationShorts;
        }

        public initializeLiquidation() {
            for (const asset of supported_asset) {
                this.liquidationLongs.set(asset, new BTree());
                this.liquidationShorts.set(asset, new BTree());
            }
        }

        public createLiquidation(price: bigint, userId: string, side: "LONG" | "SHORT", market: string,) {
            if (side === "LONG") {
                this.liquidationLongs.get(market)?.get(price) ? this.liquidationLongs.get(market)?.get(price)?.add(userId) : this.liquidationLongs.get(market)?.set(price, new Set([userId]));
            } else {
                this.liquidationShorts.get(market)?.get(price) ? this.liquidationShorts.get(market)?.get(price)?.add(userId) : this.liquidationShorts.get(market)?.set(price, new Set([userId]));
            }
        }

        public updateLiquidation(price: bigint, prevPrice: bigint, userId: string, side: "LONG" | "SHORT", market: string) {
            if (side === "LONG") {
                this.deleteLiquidation(prevPrice, userId, side, market);
                this.createLiquidation(price, userId, "LONG", market);
            } else {
                this.deleteLiquidation(prevPrice, userId, side, market);
                this.createLiquidation(price, userId, "SHORT",market);
            }
        }

        public deleteLiquidation(price: bigint, userId: string, side: "LONG" | "SHORT", market: string) {
            if (side === "LONG") {
                this.liquidationLongs.get(market)?.get(price)?.delete(userId);
                this.liquidationLongs.get(market)?.get(price)?.size === 0 ? this.liquidationShorts.get(market)?.delete(price) : null;
            } else {
                this.liquidationShorts.get(market)?.get(price)?.delete(userId);
                this.liquidationShorts.get(market)?.get(price)?.size === 0 ? this.liquidationShorts.get(market)?.delete(price) : null;
            }
        }

        public liquidateUser(price: bigint, market: string) {
            console.log(`trying to liquidating user for this asset ${market} at this price: ${price} `);
            if (this.liquidationLongs.get(market)?.length !== 0) {
                console.log(`trying.................to liquidate long`);
                for (const [liqPrice, userIdS] of [...this.liquidationLongs.get(market)?.entries()!]) {
                    if (price > liqPrice) {
                        break;
                    }
                    // we need to delete the user position
                    for (const userId of [...userIdS]) {
                        const user_position = UserManager.getInstance().getUserPositions(userId);
                        for (const [market, position] of user_position) {
                            if (position.liquidationPrice >= price) {
                                user_position.delete(market);
                                this.liquidationLongs.get(market)?.get(liqPrice)?.delete(userId);
                                console.log("user liquidated");
                            }
                        }
                    }
                    (this.liquidationLongs.get(market)?.get(liqPrice)?.size === 0 ? this.liquidationLongs.get(market)?.delete(liqPrice) : null)
                }
            }
            if (this.liquidationShorts.get(market)?.length !== 0) {
                console.log(`trying.................to liquidate short`);
                for (const [liqPrice, userIdS] of [...this.liquidationShorts.get(market)?.entriesReversed()!]) {
                    if (price < liqPrice) {
                        break;
                    }
                    // we need to delete the user position
                    for (const userId of [...userIdS]) {
                        const user_position = UserManager.getInstance().getUserPositions(userId);
                        for (const [market, position] of user_position) {
                            if (position.liquidationPrice <= price) {
                                user_position.delete(market);
                                this.liquidationShorts.get(market)?.get(liqPrice)?.delete(userId);
                                console.log("user liquidated");
                            }
                        }
                    }
                    (this.liquidationShorts.get(market)?.get(liqPrice)?.size === 0 ? this.liquidationShorts.get(market)?.delete(liqPrice) : null)
                }
            }

        }

    }

