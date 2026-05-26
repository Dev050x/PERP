import type { NextFunction, Request, Response } from "express";
import { getUserId } from "../utils/auth";
import { RedisManager } from "../store/redis-manager";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {

}

export const onrampUser = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    const userId = getUserId(req);

    // need to send to stream engine
    RedisManager.getInstance().publishMessage({
        msg: "OnRamp",
        userId,
        correlationID: crypto.randomUUID(),
    });
    //need to get back response  

    res.status(200).json({
        success: true,
        msg: "msg send to stream"
    })

}