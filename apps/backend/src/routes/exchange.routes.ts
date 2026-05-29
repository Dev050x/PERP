import { Router } from "express";
import { requireAuth } from "../utils/auth";
import { asyncHandler } from "../utils/async-handler";
import { createOrder, deleteOrder, getOpenOrders, getPostiion, initializeOrderbook, onrampUser } from "../controllers/exchange.controllers";

export const exchangeRouter = Router();

exchangeRouter.post("/onramp", requireAuth, asyncHandler(onrampUser));
exchangeRouter.post("/order", requireAuth, asyncHandler(createOrder));
exchangeRouter.post("/initialize", requireAuth, asyncHandler(initializeOrderbook));
exchangeRouter.delete("/order", requireAuth, asyncHandler(deleteOrder));
exchangeRouter.get("/position/open/:marketId", requireAuth, asyncHandler(getPostiion));
exchangeRouter.get("/orders/:marketId", requireAuth, asyncHandler(getOpenOrders));