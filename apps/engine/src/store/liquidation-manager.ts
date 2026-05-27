import BTree from "sorted-btree";

export class LiquidationManager {
    private static instance: LiquidationManager;
    private liquidationLongs: BTree<bigint, Set<string>>;
    private liquidationShorts: BTree<bigint, Set<string>>;
    
    private constructor() {
        this.liquidationLongs =  new BTree();
        this.liquidationShorts = new BTree();
    }

    public static getInstance() {
        //helloo
        if(!this.instance) {
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


}
