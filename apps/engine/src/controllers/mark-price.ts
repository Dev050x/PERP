import type { MarkPriceData, StreamData } from "types/publisher";
import { LiquidationManager } from "../store/liquidation-manager";
import { PRECISION, toBigInt } from "../utils/conversion";
import { supported_asset } from "../store/user-manager";

export function markPrice(data: MarkPriceData) {
    const valid_asset = supported_asset.filter(s => s !== "USDT");
    const markPriceOfAsset = data.prices.filter((s:StreamData) => valid_asset.includes(s.s.replace("USDC", "")));
    for(const markPrice of markPriceOfAsset) {
        LiquidationManager.getInstance().liquidateUser(toBigInt(markPrice.p, PRECISION), markPrice.s.replace("USDC",""));
    }
}