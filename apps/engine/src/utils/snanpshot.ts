import path from "path";
import fs from "fs";
import LinkedList from "dbly-linked-list";
import BTree from "sorted-btree";
import { OrderBookManager } from "../store/orderbook-manager";
import { UserManager } from "../store/user-manager";
import { LiquidationManager } from "../store/liquidation-manager";
import { RedisManager } from "../store/redis-manager";

const SNAPSHOT_INTERVAL = 24*60* 60_000;
const SNAPSHOT_DIR = path.join(process.cwd(), "src/snapshots");

function replacer(_key: string, value: any) {
    if (typeof value === "bigint") {
        return { __type: "BigInt", value: value.toString() };
    }
    if (value instanceof Map) {
        return { __type: "Map", value: Array.from(value.entries()) };
    }
    if (value instanceof Set) {
        return { __type: "Set", value: Array.from(value.values()) };
    }
    if (value instanceof LinkedList) {
        return { __type: "LinkedList", value: value.toArray() };
    }
    if (value instanceof BTree) {
        return { __type: "BTree", value: value.toArray() };
    }
    return value;
}

function reviver(_key: string, value: any) {
    if (value && typeof value === "object" && "__type" in value) {
        switch (value.__type) {
            case "BigInt":
                return BigInt(value.value);
            case "Map":
                return new Map(value.value);
            case "Set":
                return new Set(value.value);
            case "LinkedList": {
                const list = new LinkedList();
                for (const item of value.value) list.insert(item);
                return list;
            }
            case "BTree":
                return new BTree(value.value);
        }
    }
    return value;
}

type SnapshotData = {
    orderbook: ReturnType<OrderBookManager["getOrderbooks"]>;
    bestPrices: ReturnType<OrderBookManager["getBestPrices"]>;
    fills: ReturnType<OrderBookManager["getFills"]>;
    fillsByUserId: ReturnType<OrderBookManager["getFillsByUserId"]>;
    fillsByOrderId: ReturnType<OrderBookManager["getFillsByOrderId"]>;
    balances: ReturnType<UserManager["getBalances"]>;
    users: ReturnType<UserManager["getUsers"]>;
    liquidationLongs: ReturnType<LiquidationManager["getLongLiquidation"]>;
    liquidationShorts: ReturnType<LiquidationManager["getShortLiquidation"]>;
    offset: string;
};

export function snapshot() {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }

    setInterval(() => {
        const orderBookManager = OrderBookManager.getInstance();
        const userManager = UserManager.getInstance();
        const liquidationManager = LiquidationManager.getInstance();

        const currentOffset = RedisManager.getInstance().getLastOffset();
        if (!currentOffset) {
            return;
        }
        const snap: SnapshotData = {
            orderbook: orderBookManager.getOrderbooks(),
            bestPrices: orderBookManager.getBestPrices(),
            fills: orderBookManager.getFills(),
            fillsByUserId: orderBookManager.getFillsByUserId(),
            fillsByOrderId: orderBookManager.getFillsByOrderId(),
            balances: userManager.getBalances(),
            users: userManager.getUsers(),
            liquidationLongs: liquidationManager.getLongLiquidation(),
            liquidationShorts: liquidationManager.getShortLiquidation(),
            offset: currentOffset,
        };

        fs.writeFileSync(path.join(SNAPSHOT_DIR, `snapshot-${snap.offset}.json`), JSON.stringify(snap, replacer));
        console.log("snapshot taken offeset is: ", snap.offset);
    }, SNAPSHOT_INTERVAL);
}

export function loadSnapshot(filePath: string): SnapshotData {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw, reviver) as SnapshotData;
}

export function loadLatestSnapshot(): SnapshotData | null {
    if (!fs.existsSync(SNAPSHOT_DIR)) return null;
    const files = fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.startsWith("snapshot-"));
    if (files.length === 0) return null;

    const parseOffset = (filename: string) => {
        const match = filename.match(/snapshot-(\d+)-(\d+)\.json/);
        if (!match) return { ts: 0, seq: 0 };
        return { ts: Number(match[1]), seq: Number(match[2]) };
    };

    const latest = files.sort((a, b) => {
        const oa = parseOffset(a);
        const ob = parseOffset(b);
        return oa.ts !== ob.ts ? ob.ts - oa.ts : ob.seq - oa.seq;
    })[0]!;

    return loadSnapshot(path.join(SNAPSHOT_DIR, latest));
}

let cachedSnapshot: SnapshotData | null | undefined;

export function getLatestSnapshotCached(): SnapshotData | null {
    if (cachedSnapshot === undefined) {
        cachedSnapshot = loadLatestSnapshot();
    }
    return cachedSnapshot;
}