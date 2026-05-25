import type { NextFunction, Request, Response } from "express";
import { getUserId } from "../utils/auth";
import { RedisManager } from "../store/redis-manager";
import { success } from "zod";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {

}

export const onrampUser = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    const userId = getUserId(req);

    // need to send to stream engine
    RedisManager.getInstance().publishMessage({
        msg: "Onramp",
        userId
    });
    //need to get back response  

    res.status(200).json({
        success: true,
        msg: "msg send to stream"
    })

}