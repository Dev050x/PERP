import type { UserBalance, UserDetails } from "types";

export class UserManager {
    private static instance: UserManager;
    private Balances: Map<string, Record<string, UserBalance>>;
    private users: Map<string, UserDetails>;

    private constructor() {
        this.Balances = new Map();
        this.users = new Map();
    }

    public static get_instance() {
        if(!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public get_user_balance(userId: string) {
        return this.Balances.get(userId);
    }

    public get_user_orders(userId: string) {
        return this.users.get(userId)?.orders;
    }

    public get_user_positions(userId: string) {
        return this.users.get(userId)?.positions;
    }
}