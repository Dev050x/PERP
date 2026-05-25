import "dotenv/config";

export const env = {
    port: (process.env.PORT ?? 3000),
    jwt_secret: (process.env.JWT_SECRET ?? "random")
}