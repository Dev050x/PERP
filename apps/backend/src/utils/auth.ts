import type { NextFunction, Request, Response } from "express";
import {env} from "../utils/env";
import jwt from "jsonwebtoken";

export interface TokenPayload {
    userId: string,
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const autheHeader = req.headers.authorization;
    const token = typeof autheHeader === "string" && autheHeader.startsWith("Bearer") ? autheHeader.slice(7) : undefined;

    if(!token) {
        res.status(400).json({
            success: false,
            msg: "Please Do Login first"
        })
        return;
    };

    try {
        const jwt_secret = env.jwt_secret!;
        const payload = jwt.verify(token, env.jwt_secret!) as TokenPayload;
        req.userId = payload.userId;
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            msg: "Please Provid Valid Token"
        })
    };

}

export function getUserId(req: Request) {
    if(!req.userId){
       throw new Error("User is not authenticated");
    }

    return req.userId;
}