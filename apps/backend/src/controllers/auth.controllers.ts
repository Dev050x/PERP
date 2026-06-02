import type { Request, Response } from "express";
import { authSchema } from "types/auth";
import { sendValidationError } from "../utils/validation";
import { prisma } from "db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../utils/env";

export const signUp = async (req: Request, res: Response): Promise<void>  => {
    const parsedBody = authSchema.safeParse(req.body);

    if (!parsedBody.success) {
        sendValidationError(res, parsedBody.error);
        return;
    }

    const password = await bcrypt.hash(parsedBody.data.password, 10);

    try {

        const user = await prisma.user.create({
            data: {
                username: parsedBody.data.username,
                password: password,
            }
        })


        res.status(200).json({
            success: true,
            userId: user.id,
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            msg: "user already exists",
            error: error instanceof Error ? error.message : "",
        })
    }

}

export const singIn = async (req: Request, res: Response) => {
    const parsedBody = authSchema.safeParse(req.body);

    if(!parsedBody.success){
        sendValidationError(res, parsedBody.error);
        return;
    }

    const user = await prisma.user.findUnique({
        where: {
            username: parsedBody.data.username,
        }
    });

    if(!user){
        res.status(400).json({
            success: false,
            msg: "user doesn't exists",
        })
        return;
    }

    const isMatch = await bcrypt.compare(parsedBody.data.password, user?.password);

    if(!isMatch){
        res.status(400).json({
            success: false,
            msg: "password is not correct",
        })
        return;
    }

    
    const token = jwt.sign({userId: user.id}, 
        env.jwt_secret
    );

    res.status(200).json({
        userId: user.id,
        token,
    })
}