import type { Order, OrderStatus, UserBalance, UserDetails, UserOrder } from "types";
import { PRECISION, toBigInt } from "../utils/conversion";

export const supported_asset = ["SOL", "ETH", "USDC"];
const HARD_CORDED_USER = "c43838a8-e271-4599-8b16-696296c02869";

export class UserManager {
    private static instance: UserManager;
    private Balances: Map<string, Record<string, UserBalance>>;
    private users: Map<string, UserDetails>;

    private constructor() {
        this.Balances = new Map();
        this.users = new Map();
        this.initializeUserBalance(HARD_CORDED_USER);
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

    public getUserPositions(userId: string) {
        return this.users.get(userId)?.positions;
    }

    public createUser(userId: string) {
        const user = this.users.set(userId, {
            orders: new Map(),
            positions: new Map(),
        });
        const user_balance = this.Balances.set(userId, {});
        return user;
    };

    public initializeUserBalance(userId: string) {
        const user_balance = this.Balances.set(userId, {}).get(userId);
        if (!user_balance) {
            throw new Error("user does not exists");
        }
        for (const asset of supported_asset) {
            if (!user_balance[asset]) {
                user_balance[asset] = {
                    availableBalance: 0n,
                    lockedBalance: 0n,
                };
            }
        }
        if (user_balance["USDC"]) {
            user_balance["USDC"].availableBalance += 1000_000_000n;
        }
        this.users.set(userId, {
            orders: new Map(),
            positions: new Map()
        });
        return this.Balances.get(userId)!;
    }

    public addAssetInUserBalance(userId: string) {
        const user_balance = this.getUserBalances(userId)!;
        for (const asset of supported_asset) {
            if (!user_balance[asset]) {
                user_balance[asset] = {
                    availableBalance: 0n,
                    lockedBalance: 0n,
                }
            }
        }
    };

    public hasEnoughBalance(userId: string, margin: bigint, asset: string): boolean {
        const user_balance = this.getUserBalances(userId)!;
        if (user_balance[asset] && user_balance[asset].availableBalance >= margin) {
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

    public getUserOrder(userId: string, orderId: string) {
        return this.getUser(userId)?.orders.get(orderId);
    }

}