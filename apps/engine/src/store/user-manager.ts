import type { Order, OrderStatus, Position, UserBalance, UserDetails, UserOrder } from "types";
import { PRECISION, toBigInt } from "../utils/conversion";
import { calculateAveragePrice, calculateLiquidationPrice, calculateUnrealPnl } from "../utils/calculation";
import { LiquidationManager } from "./liquidation-manager";

export const supported_asset = ["SOL", "ETH", "USDC"];
const HARD_CORDED_USER = "ce79888d-8889-4c4f-8f2d-3fd4a7bb2d8f";
const HARD_CORDED_USER_1 = "50fc21c2-cf9b-4052-9f58-98be05c91e08";
const HARD_CORDED_USER_2 = "6da9a93a-2aa7-496d-9be2-3c82bb0427b3";

export class UserManager {
    private static instance: UserManager;
    private Balances: Map<string, Record<string, UserBalance>>;
    private users: Map<string, UserDetails>;

    private constructor() {
        this.Balances = new Map();
        this.users = new Map();
        this.initializeUserBalance(HARD_CORDED_USER);
        this.initializeUserBalance(HARD_CORDED_USER_1);
        this.initializeUserBalance(HARD_CORDED_USER_2);
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public getUser(userId: string) {
        if (!this.users.get(userId)) {
            console.log("error");
            throw new Error("user does not exist");
        }
        return this.users.get(userId);
    }

    public getUserBalances(userId: string) {
        if (!this.Balances.get(userId)) {
            console.log("user does not deposit any asset");
            throw new Error("user does not deposit any asset");
        }
        return this.Balances.get(userId);
    }

    public getUserOrders(userId: string) {
        if(!this.users.get(userId)?.orders){
            throw new Error("user doesn't have any open orders");
        }
        return this.users.get(userId)?.orders;
    }

    public getUserOrder(userId: string, orderId: string) {
        return this.getUser(userId)?.orders.get(orderId);
    }

    public getUserPositions(userId: string) {
        const userPositions = this.users.get(userId)?.positions;
        if(!userPositions){
            throw new Error("User does not have any positions");
        }
        return userPositions;
    }

    public getUserPositionByMarket(userId: string, market: string) {
        const userPositionsByMarket = this.users.get(userId)?.positions.get(market);
        if(!userPositionsByMarket) {
            return null;
        }
        return userPositionsByMarket;
    
    }

    public createUser(userId: string) {
        const user = this.users.set(userId, {
            orders: new Map(),
            positions: new Map(),
        });
        const userBal = this.Balances.set(userId, {});
        return user;
    };

    public getUsers() {
        return this.users;
    }

    public getBalances() {
        return this.Balances;
    }


    public closeUserPosition(position: Position, price: bigint) {
        const unPnl = calculateUnrealPnl(position, price);
        const relFund = position.margin + unPnl;
        const userBal = this.getUserBalances(position.userId)![position.market]!;
        userBal.availableBalance += relFund < 0n ? 0n : relFund;
        userBal.lockedBalance -= (position.margin);
        this.getUser(position.userId)?.positions.delete(position.market);
        LiquidationManager.getInstance().deleteLiquidation(position.averagePrice, position.userId, position.side, position.market);
    }

    public createUserPosition(userId: string, averagePrice: bigint, market: string, qty: bigint, side: "LONG" | "SHORT", margin: bigint) {
        const user = this.getUser(userId)!;
        const userBal = this.getUserBalances(userId)![market]!;
        const exisPos = user.positions.get(market);
        if (exisPos) {
            //same side
            if (exisPos.side === side) {
                const newAvgPrice = calculateAveragePrice(exisPos.averagePrice, exisPos.qty, averagePrice, qty);
                const newLiquidPrice = calculateLiquidationPrice(newAvgPrice, exisPos.qty + qty, exisPos.margin + margin, side);
                LiquidationManager.getInstance().updateLiquidation(newLiquidPrice, exisPos.liquidationPrice, userId, side, market);
                exisPos.qty += qty;
                exisPos.margin += margin;
                exisPos.averagePrice = newAvgPrice;
                exisPos.liquidationPrice = newLiquidPrice;
                //TODO: calculate pnl
            } else {
                if (exisPos.qty < qty) {
                    const newQty = qty - exisPos.qty;
                    this.closeUserPosition(exisPos, averagePrice);
                    const newMargin = (margin * newQty) / qty;
                    this.createUserPosition(userId, averagePrice, market, newQty, side, margin);
                } else {
                    const releasedMargin = (exisPos.margin * qty) / exisPos.qty;
                    const realizedPnl = exisPos.side === 'LONG'
                        ? (averagePrice - exisPos.averagePrice) * qty
                        : (exisPos.averagePrice - averagePrice) * qty;
                    const relFund = releasedMargin + realizedPnl;
                    userBal.availableBalance += (relFund < 0 ? 0n: relFund);
                    userBal.lockedBalance -= releasedMargin;
                    exisPos.qty -= qty;
                    exisPos.margin -= releasedMargin;
                    const prevLiquidPrice = exisPos.liquidationPrice;
                    if(exisPos.qty === 0n ){
                        UserManager.getInstance().users.get(userId)?.positions.delete(market);
                        LiquidationManager.getInstance().deleteLiquidation(prevLiquidPrice, userId, exisPos.side, market);
                        console.log("adjusted positions : ", user.positions.get(market));
                        return;
                    }
                    const newLiquidPrice = calculateLiquidationPrice(exisPos.averagePrice, exisPos.qty, exisPos.margin, exisPos.side);
                    LiquidationManager.getInstance().updateLiquidation(newLiquidPrice, prevLiquidPrice, exisPos.userId, exisPos.side, market);
                }
            }
            console.log("adjusted positions : ", user.positions.get(market));

        } else {
            console.log(`price: ${averagePrice} market: ${market} qty: ${qty} margin: ${margin} `);
            const liquidationPrice = calculateLiquidationPrice(averagePrice, qty, margin, side);
            user.positions.set(market, {
                side,
                qty,
                margin,
                liquidationPrice,
                averagePrice,
                pnl: 0n,
                userId,
                market
            });
            LiquidationManager.getInstance().createLiquidation(liquidationPrice, userId, side, market);
            console.log("user position: ", user.positions.get(market));
        }
    }

    public initializeUserBalance(userId: string) {
        const userBal = this.Balances.set(userId, {}).get(userId);
        if (!userBal) {
            throw new Error("user does not exists");
        }
        for (const asset of supported_asset) {
            if (!userBal[asset]) {
                userBal[asset] = {
                    availableBalance: 0n,
                    lockedBalance: 0n,
                };
            }
        }
        if (userBal["USDC"]) {
            userBal["USDC"].availableBalance += 10000_000_000n;
        }
        this.users.set(userId, {
            orders: new Map(),
            positions: new Map()
        });
        return this.Balances.get(userId)!;
    }

    public addAssetInUserBalance(userId: string) {
        const userBal = this.getUserBalances(userId)!;
        for (const asset of supported_asset) {
            if (!userBal[asset]) {
                userBal[asset] = {
                    availableBalance: 0n,
                    lockedBalance: 0n,
                }
            }
        }
    };

    public hasEnoughBalance(userId: string, margin: bigint, asset: string): boolean {
        const userBal = this.getUserBalances(userId)!;
        if (userBal[asset] && userBal[asset].availableBalance >= margin) {
            return true;
        }
        return false;
    }

    public lockUserBalance(userId: string, asset: string, amount: bigint) {
        const user_asset_balance = this.getUserBalances(userId)?.[asset]!;
        user_asset_balance.availableBalance -= amount;
        user_asset_balance.lockedBalance += amount;
    }

    public unlockUserBalance(userId: string, asset: string, amount: bigint) {
        const user_asset_balance = this.getUserBalances(userId)?.[asset]!;
        user_asset_balance.availableBalance += amount;
        user_asset_balance.lockedBalance -= amount;
    }

    public addUserOrder(data: UserOrder, orderId: string, status: OrderStatus) {
        const user = this.getUser(data.userId)!;
        const order: Order = {
            orderId,
            userId: data.userId,
            market: data.market,
            side: data.side,
            qty: toBigInt(data.qty, PRECISION),
            margin: toBigInt(data.margin, PRECISION),
            type: data.type,
            price: toBigInt(data.price!, PRECISION),
            status,
        };
        user.orders.set(orderId, order);
    }
}