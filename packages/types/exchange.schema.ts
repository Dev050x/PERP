import z, { string } from "zod";

const PRECISION = 8;

function precisionString(precision: number) {
    return z.string().refine(
        value => {
            const [_, fraction = ""] = value.split(".")
            return fraction.length <= PRECISION;
        },
        { message: `Maximum Precision ${PRECISION} allowed in price` }
    );
}

export const createOrderSchema = z.discriminatedUnion("type", [
    z.object({
        side: z.enum(["LONG", "SHORT"]),
        type: z.literal("limit"),
        price: precisionString(PRECISION).optional(),
        qty: precisionString(PRECISION),
        margin: precisionString(PRECISION),
        market: z.string(),
    }),
    z.object({
        side: z.enum(["LONG", "SHORT"]),
        type: z.literal("market"),
        price: precisionString(PRECISION).optional(),
        qty: precisionString(PRECISION),
        margin: precisionString(PRECISION),
        market: z.string(),
    })
]);

export const onrampSchema = z.object({
    amount: string(),
});

export const withdrawSchema = z.object({
    amount: string(),
});

export const deleteOrderSchema = z.object({
    orderId: string(),
})

export const getPositionSchema = z.object({
    marketId: string(),
})

export const getOrdersSchema = z.object({
    marketId: string(),
});

export const getDepthSchema = z.object({
    marketId: string(),
});

export const getCandlesSchema = z.object({
    marketId: z.string(),
    interval: z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]).optional().default("1m"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    limit: z.string().optional(),
});

export const getTradesSchema = z.object({
    marketId: z.string(),
    limit: z.string().optional(),
});