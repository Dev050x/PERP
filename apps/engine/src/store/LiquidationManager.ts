import BTree from "sorted-btree";

export class LiquidationManager {
    private static instance: LiquidationManager;
    private liquidationLongs: BTree<bigint, Set<string>>;
    private liquidationShorts: BTree<bigint, Set<string>>;
    
    private constructor() {
        this.liquidationLongs =  new BTree();
        this.liquidationShorts = new BTree();
    }

    public static get_instance() {
        if(!this.instance) {
            this.instance = new LiquidationManager();
        }
        return this.instance;
    }

    public get_long_liquidation() {
        return this.liquidationLongs;
    }

    public get_short_liquidation() {
        return this.liquidationShorts;
    }


}