import z, { string } from "zod";

const PRECISION = 6;

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


export const deleteOrderSchema = z.object({
    orderId: string(),
})

export const getPositionSchema = z.object({
    marketId: string(),
})

export const getOrdersSchema = z.object({
    marketId: string(),
});