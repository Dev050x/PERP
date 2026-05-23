import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { signUp, singIn } from "../controllers/auth.controllers";

export const authRouter = Router();

authRouter.post("/sign-up", asyncHandler(signUp));
authRouter.post("/sign-in", asyncHandler(singIn));
