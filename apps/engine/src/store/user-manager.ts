import type { Order, OrderStatus, Position, UserBalance, UserDetails, UserOrder } from "types";
import { PRECISION, toBigInt } from "../utils/conversion";
import { calculateAveragePrice, calculateLiquidationPrice, calculateUnrealPnl } from "../utils/calculation";

export const supported_asset = ["SOL", "ETH", "USDC"];
const HARD_CORDED_USER = "c43838a8-e271-4599-8b16-696296c02869";
const HARD_CORDED_USER_1 = "ac896fbc-02fd-4324-ba13-45e9003d4c50";
const HARD_CORDED_USER_2 = "91245d45-b1ed-4b74-a0d5-2a1a17326052";

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
        return this.users.get(userId)?.orders;
    }

    public getUserOrder(userId: string, orderId: string) {
        return this.getUser(userId)?.orders.get(orderId);
    }

    public getUserPositions(userId: string) {
        return this.users.get(userId)?.positions;
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
                }
            }

        } else {
            console.log(`price: ${averagePrice} market: ${market} qty: ${qty} margin: ${margin} `);
            user.positions.set(market, {
                side,
                qty,
                margin,
                liquidationPrice: calculateLiquidationPrice(averagePrice, qty, margin, side),
                averagePrice,
                pnl: 0n,
                userId,
                market
            });
            console.log("user position: ", calculateLiquidationPrice(averagePrice, qty, margin, side));
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