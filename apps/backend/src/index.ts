import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./utils/env";
import { authRouter } from "./routes/auth.routes";
import { exchangeRouter } from "./routes/exchange.routes";
const app = express();

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
        ok: true
    })
});

app.use("/api/v1", authRouter);
app.use("/api/v1", exchangeRouter);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    res.status(500).json({
        error: err instanceof Error ? err.message : "internal server error"
    });
});

app.listen(env.port, () => {
    console.log(`server is running on Port No. ${env.port}`);
})