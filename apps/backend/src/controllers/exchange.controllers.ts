import type { NextFunction, Request, Response } from "express";
import { getUserId } from "../utils/auth";
import { RedisManager } from "../store/redis-manager";
import { waitForEngineResponse } from "../utils/pending-response";
import { createOrderSchema, deleteOrderSchema } from "types/exchange";
import { sendValidationError } from "../utils/validation";

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
            type: parsedBody.data?.type,
            market: parsedBody.data.market,
        },
        correlationID
    });

    const response = await waitForEngineResponse(correlationID, 5000);
    console.log("response", response.error);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        msg: "Order Placed succefully",
        data: response.data,
    });

}

export const deleteOrder = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const parsedBody = deleteOrderSchema.safeParse(req.query);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }

    const correlationID = crypto.randomUUID();

    await RedisManager.getInstance().publishMessage({
        msg: "CancelOrder",
        data: {
            userId,
            orderId: parsedBody.data.orderId
        },
        correlationID
    });

    const response = await waitForEngineResponse(correlationID, 5000);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        msg: "Order Canelled",
        data: response.data,
    });

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

export const initializeOrderbook = async (req: Request, res: Response, next: NextFunction) => {
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
