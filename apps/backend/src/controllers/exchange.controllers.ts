import type { NextFunction, Request, Response } from "express";
import { prisma } from "db";
import { getUserId } from "../utils/auth";
import { RedisManager } from "../store/redis-manager";
import { waitForEngineResponse } from "../utils/pending-response";
import { createOrderSchema, deleteOrderSchema, getCandlesSchema, getDepthSchema, getOrdersSchema, getPositionSchema, getTradesSchema, onrampSchema, withdrawSchema } from "types/exchange";
import { sendValidationError } from "../utils/validation";
import { aggregateCandles } from "../utils/candle-aggregator";

const ENGINE_TIMEOUT_MS = parseInt(process.env.ENGINE_TIMEOUT_MS || "10000", 10);

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

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);
    console.log("response", response.error);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        success: true,
        msg: "Order placed successfully",
        data: {
            order: response.data.order,
            fills: response.data.fills ?? null,
            position: Object.keys(response.data.position ?? {}).length > 0 
                ? response.data.position 
                : null
        }
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

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        msg: "Order Canelled",
        order: response.data.order
    });

}

export const onrampUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const parsedBody = onrampSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            success: false,
            msg: "Please Provide Proper Inputs",
        });
        return;
    }

    const correlationID = crypto.randomUUID();
    await RedisManager.getInstance().publishMessage({
        msg: "OnRamp",
        data: {
            userId,
            amount: parsedBody.data.amount

        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);
    const data = response.data;

    res.status(200).json({
        msg: "deposit completed successfully.",
        data,
    })

}

export const withdrawUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const parsedBody = withdrawSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            success: false,
            msg: "Please Provide Proper Inputs",
        });
        return;
    }

    const correlationID = crypto.randomUUID();
    await RedisManager.getInstance().publishMessage({
        msg: "Withdraw",
        data: {
            userId,
            amount: parsedBody.data.amount,
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    const data = response.data;

    res.status(200).json({
        msg: "Withdrawal completed successfully.",
        data,
    });
}

export const getUserBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = getUserId(req);
    const correlationID = crypto.randomUUID();

    await RedisManager.getInstance().publishMessage({
        msg: "GetBalance",
        data: {
            userId,
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        const errStr = typeof response.error === "string" ? response.error : "";
        if (errStr.includes("user does not deposit") || errStr.includes("deposit any asset")) {
            res.status(200).json({
                success: true,
                data: {
                    userBalance: {
                        availableBalance: "0.00000000",
                        lockedBalance: "0.00000000"
                    }
                }
            });
            return;
        }
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    const data = response.data;

    res.status(200).json({
        data,
    });
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

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);
    console.log("response: ", response);
    const data = response.data;

    res.status(200).json({
        msg: "Order books initialized succefully",
        markets: data,
    })

}

export const getPostiion = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const parsedBody = getPositionSchema.safeParse(req.params);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }
    const marketId = parsedBody.data.marketId;
    const correlationID = crypto.randomUUID();
    console.log("parsed data: ", parsedBody.data);
    await RedisManager.getInstance().publishMessage({
        msg: "GetPosition",
        data: {
            userId,
            marketId: marketId,
        },
        correlationID
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);
    console.log("response: ", response);

    if (response.error) {
        const errStr = typeof response.error === "string" ? response.error : "";
        if (errStr.includes("user does not deposit") || errStr.includes("deposit any asset") || errStr.includes("User does not have any positions")) {
            res.status(200).json({
                success: true,
                msg: "here is the position",
                data: { position: null }
            });
            return;
        }
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        msg: "here is the position",
        data: response.data,
    });

}

export const getAllPositions = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const correlationID = crypto.randomUUID();

    await RedisManager.getInstance().publishMessage({
        msg: "GetAllPositions",
        data: {
            userId,
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        const errStr = typeof response.error === "string" ? response.error : "";
        if (errStr.includes("user does not deposit") || errStr.includes("deposit any asset") || errStr.includes("User does not have any positions")) {
            res.status(200).json({
                success: true,
                msg: "here are all positions",
                data: []
            });
            return;
        }
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        msg: "here are all positions",
        data: response.data,
    });
};

export const getOrders = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const parsedBody = getOrdersSchema.safeParse(req.params);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }

    try {
        const orders = await prisma.orders.findMany({
            where: {
                userId,
                market: parsedBody.data.marketId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            msg: "Orders fetched successfully",
            data: {
                orders,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch orders from database",
        });
    }
};

export const getOpenOrders = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const parsedBody = getOrdersSchema.safeParse(req.params);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }

    try {
        const openOrders = await prisma.orders.findMany({
            where: {
                userId,
                market: parsedBody.data.marketId,
                status: {
                    in: ["open", "partiallyFilled"],
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            msg: "Open orders fetched successfully",
            data: {
                orders: openOrders,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch open orders from database",
        });
    }
};

export const getFills = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const correlationID = crypto.randomUUID();

    await RedisManager.getInstance().publishMessage({
        msg: "GetFills",
        data: {
            userId,
        },
        correlationID
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        const errStr = typeof response.error === "string" ? response.error : "";
        if (
            errStr.includes("user does not deposit") ||
            errStr.includes("deposit any asset") ||
            errStr.toLowerCase().includes("fills does not exist")
        ) {
            res.status(200).json({
                success: true,
                data: []
            });
            return;
        }
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        data: response.data,
    });
}

export const getDepth = async (req: Request, res: Response) => {
    const correlationID = crypto.randomUUID();
    const parsedBody = getDepthSchema.safeParse(req.params);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }

    await RedisManager.getInstance().publishMessage({
        msg: "GetDepth",
        data: {
            userId: "get-depth",
            market: parsedBody.data.marketId,
        },
        correlationID,
    });

    const response = await waitForEngineResponse(correlationID, ENGINE_TIMEOUT_MS);

    if (response.error) {
        res.status(400).json({
            success: false,
            error: response.error ? response.error : "some user error",
        });
        return;
    }

    res.status(200).json({
        ...response.data
    });
}

export const getCandles = async (req: Request, res: Response) => {
    const parsedParams = getCandlesSchema.safeParse({
        marketId: req.params.marketId,
        interval: req.query.interval,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        limit: req.query.limit,
    });

    if (!parsedParams.success) {
        sendValidationError(res, parsedParams.error);
        return;
    }

    const { marketId, interval, startTime, endTime, limit } = parsedParams.data;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 1000) : 500;

    try {
        const dbCandles = await prisma.candle.findMany({
            where: {
                market: marketId,
                timestamp: {
                    gte: startTime ? new Date(Number(startTime) * (Number(startTime) < 1e11 ? 1000 : 1)) : undefined,
                    lte: endTime ? new Date(Number(endTime) * (Number(endTime) < 1e11 ? 1000 : 1)) : undefined,
                },
            },
            orderBy: {
                timestamp: "asc",
            },
            take: limitNum,
        });

        const formattedCandles = aggregateCandles(dbCandles, interval as any);

        res.status(200).json({
            success: true,
            msg: "Candles fetched successfully",
            data: {
                market: marketId,
                interval,
                candles: formattedCandles,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch candle data from database",
        });
    }
};

export const getRecentTrades = async (req: Request, res: Response) => {
    const parsedParams = getTradesSchema.safeParse({
        marketId: req.params.marketId,
        limit: req.query.limit,
    });

    if (!parsedParams.success) {
        sendValidationError(res, parsedParams.error);
        return;
    }

    const { marketId, limit } = parsedParams.data;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;

    try {
        const fills = await prisma.fills.findMany({
            where: {
                market: marketId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limitNum,
        });

        const trades = fills.map((f) => ({
            id: f.id,
            price: f.price,
            quantity: f.quantity,
            makerId: f.makerId,
            takerId: f.takerId,
            isBuyerMaker: f.makerId === f.longUserId || f.makerId === f.longOrderId,
            timestamp: Math.floor(new Date(f.createdAt).getTime() / 1000),
            createdAt: f.createdAt,
        }));

        res.status(200).json({
            success: true,
            msg: "Recent trades fetched successfully",
            data: {
                market: marketId,
                trades,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch trade data from database",
        });
    }
};