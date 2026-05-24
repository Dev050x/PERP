import { Router } from "express";
import { requireAuth } from "../utils/auth";
import { asyncHandler } from "../utils/async-handler";
import { createOrder } from "../controllers/exchange.controllers";

export const exchangeRouter = Router();

exchangeRouter.post("/order", requireAuth, asyncHandler(createOrder));