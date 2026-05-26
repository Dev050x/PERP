import type { UserBalance, UserDetails } from "types";

const supported_asset = ["SOL", "ETH", "USDC"];

export class UserManager {
    private static instance: UserManager;
    private Balances: Map<string, Record<string, UserBalance>>;
    private users: Map<string, UserDetails>;

    private constructor() {
        this.Balances = new Map();
        this.users = new Map();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public getUserBalance(userId: string) {
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
        const user_balance = this.getUserBalance(userId);
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
        if(user_balance["USDC"]){
            user_balance["USDC"].availableBalance += 1000_000_000n;
        }
        return this.Balances.get(userId)!;
    }

    public updateUserBalance(userId: string) {
        const user_balance = this.getUserBalance(userId)!;
        for (const asset of supported_asset) {
            if (!user_balance[asset]) {
                user_balance[asset] = {
                    availableBalance: 0n,
                    lockedBalance: 0n,
                }
            }
        }
    };

}