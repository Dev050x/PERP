import z from "zod";

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
        price: precisionString(PRECISION),
        qty: precisionString(PRECISION),
        margin: precisionString(PRECISION),
        symbol: z.string(),
    }),
    z.object({
        side: z.enum(["LONG", "SHORT"]),
        type: z.literal("market"),
        price: precisionString(PRECISION),
        qty: precisionString(PRECISION),
        margin: precisionString(PRECISION),
        symbol: z.string(),
    })
]);