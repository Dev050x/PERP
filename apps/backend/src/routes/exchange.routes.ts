import { Router } from "express";
import { requireAuth } from "../utils/auth";
import { asyncHandler } from "../utils/async-handler";
import { createOrder, onrampUser } from "../controllers/exchange.controllers";

export const exchangeRouter = Router();

exchangeRouter.post("/onramp", requireAuth, asyncHandler(onrampUser));
exchangeRouter.post("/order", requireAuth, asyncHandler(createOrder));