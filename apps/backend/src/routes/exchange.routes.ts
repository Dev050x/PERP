import { Router } from "express";
import { requireAuth } from "../utils/auth";
import { asyncHandler } from "../utils/async-handler";
import { createOrder, deleteOrder, getAllPositions, getCandles, getDepth, getFills, getOpenOrders, getOrders, getPostiion, getRecentTrades, getUserBalance, initializeOrderbook, onrampUser, withdrawUser } from "../controllers/exchange.controllers";

export const exchangeRouter = Router();

exchangeRouter.post("/onramp", requireAuth, asyncHandler(onrampUser));
exchangeRouter.post("/withdraw", requireAuth, asyncHandler(withdrawUser));
exchangeRouter.get("/balance", requireAuth, asyncHandler(getUserBalance));
exchangeRouter.post("/order", requireAuth, asyncHandler(createOrder));
exchangeRouter.post("/initialize", requireAuth, asyncHandler(initializeOrderbook));
exchangeRouter.delete("/order", requireAuth, asyncHandler(deleteOrder));
exchangeRouter.get("/position/open", requireAuth, asyncHandler(getAllPositions));
exchangeRouter.get("/position/open/:marketId", requireAuth, asyncHandler(getPostiion));
exchangeRouter.get("/orders/:marketId", requireAuth, asyncHandler(getOrders));
exchangeRouter.get("/orders/open/:marketId", requireAuth, asyncHandler(getOpenOrders));
exchangeRouter.get("/fills", requireAuth, asyncHandler(getFills));
exchangeRouter.get("/depth/:marketId", asyncHandler(getDepth));
exchangeRouter.get("/candles/:marketId", asyncHandler(getCandles));
exchangeRouter.get("/trades/:marketId", asyncHandler(getRecentTrades));