import type { NextFunction, Request, Response } from "express";
import { getUserId } from "../utils/auth";
import { RedisManager } from "../store/redis-manager";
import { waitForEngineResponse } from "../utils/pending-response";
import { createOrderSchema } from "types/exchange";
import type { ReservedSQL } from "bun";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const parsedBody = createOrderSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            success: false,
            msg: "Please Provide Proper Inputs",
        });
        return;
    }

    const correlationID = crypto.randomUUID();
    await RedisManager.getInstance().publishMessage({
        msg: "CreateOrder",
        data: {
            userId,
            qty: parsedBody.data?.qty,
            price: parsedBody.data?.price,
            margin: parsedBody.data?.margin,
            side: parsedBody.data?.side,
            type: parsedBody.data?.type
        },
        correlationID
    });

    const response = await waitForEngineResponse(correlationID, 5000);
    const data = response.data;

    res.status(200).json({
        msg: "Order Placed succefully",
        data,
    })

}

export const onrampUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);

    const correlationID = crypto.randomUUID();
    await RedisManager.getInstance().publishMessage({
        msg: "OnRamp",
        data: {
            userId
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, 5000);
    const data = response.data;

    res.status(200).json({
        msg: "Your wallet balance has been set up successfully.",
        data,
    })

}

export const initializeOrderbook = async (req: Request, res: Response, next: NextFunction)  => {
    //TODO: need to protected by user
    const userId = getUserId(req);

    const correlationID = crypto.randomUUID();

    await RedisManager.getInstance().publishMessage({
        msg: "InitializeOrderBook",
        data: {
            userId
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, 5000);
    console.log("response: ", response);
    const data = response.data;

    res.status(200).json({
        msg: "Order books initialized succefully",
        markets: data,
    })

}