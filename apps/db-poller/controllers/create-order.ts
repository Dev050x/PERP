import { prisma } from "db";
import type { CreateOrderResponseData } from "types/receiver";
import type { side, type } from "../../../packages/db/generated/prisma/enums";

export async function createOrder(data: CreateOrderResponseData) {
    console.log("pushing create order resposse to DB: ", data);
    const fills = data.fills.length !== 0 ? data.fills.map(fill => {
        return {
            longUserId: fill.LongUserId,
            shortUserId: fill.ShortUserId,
            makerId: fill.makerId,
            takerId: fill.takerId,
            longOrderId: fill.buyOrderId,
            shortOrderId: fill.sellOrderId,
            price: fill.price,
            quantity: fill.price,
            market: fill.market
        }
    }) : null;
    const position = data.position ? {
        userId: data.userId,
        Side: data.position.side.toLocaleLowerCase() as side,
        quantity: data.position.qty,
        margin: data.position.margin,
        liquidationPrice: data.position.liquidationPrice,
        averagePrice: data.position.averagePrice,
        market: data.position.market
    } : null;

    const order = {
        quantity: data.order.qty,
        price: data.order.price,
        side: data.order.side.toLocaleLowerCase() as side,
        type: data.order.type as type,
        userId: data.userId,
        market: data.order.market
    };
    
    await prisma.$transaction(async (tx) => {
        await prisma.orders.create({
            data: order
        });

        if (fills?.length) {
            await prisma.fills.createMany({
                data: fills,
            });
        }

        if (position) {
            await prisma.position.create({
                data: position,
            });
        }

    })
}