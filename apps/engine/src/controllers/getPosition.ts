import type { GetPositionData } from "types/publisher";
import { UserManager } from "../store/user-manager";
import { SerializeData } from "../utils/serialize";

export function GetPosition(data: GetPositionData) {
    const userManager = UserManager.getInstance();
    const userPositions = userManager.getUserPositions(data.userId);
    const marketId = data.marketId;
    const userAssetPosition = userPositions.get(data.marketId);
    if(userAssetPosition) {
        return {
            position: SerializeData(userAssetPosition)
        };
    }
    throw new Error("User does not have any open positions for this asset");
}
