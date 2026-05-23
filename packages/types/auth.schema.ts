import z from "zod";

export const authSchema = z.object({
    username: z.string().min(5),
    password: z.string().min(5),
});