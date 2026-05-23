import type { Request, Response } from "express";
import { authSchema } from "types/auth";
import { sendValidationError } from "../utils/validation";
import { prisma } from "db";
import bcrypt from "bcrypt";


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
                password: password

            }
        });


        res.status(200).json({
            success: true,
            userId: user.id,
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            msg: "user already exists",
        })
    }

}

export const singIn = async (req: Request, res: Response) => {

}