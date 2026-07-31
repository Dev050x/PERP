import { prisma } from "db";
import type { CreateOrderResponseData } from "types/receiver";
import type { orderStatus, side, type } from "../../../packages/db/generated/prisma/enums";
import { updateCandles } from "./create-candle";

export async function createOrder(data: CreateOrderResponseData) {
  console.log("pushing create order resposse to DB: ", data);
  const fills =
    data.fills.length !== 0
      ? data.fills.map((fill) => {
          return {
            longUserId: fill.LongUserId,
            shortUserId: fill.ShortUserId,
            makerId: fill.makerId,
            takerId: fill.takerId,
            longOrderId: fill.buyOrderId,
            shortOrderId: fill.sellOrderId,
            price: fill.price,
            quantity: fill.price,
            market: fill.market,
          };
        })
      : null;
  const order = {
    id: data.order.orderId,
    quantity: data.order.qty,
    price: data.order.price,
    side: data.order.side.toLocaleLowerCase() as side,
    type: data.order.type as type,
    status: (data.order.status || "open") as orderStatus,
    userId: data.userId,
    market: data.order.market,
  };

  await prisma.$transaction(async (tx) => {
    await prisma.orders.create({
      data: order,
    });

    if (fills?.length) {
      await prisma.fills.createMany({
        data: fills,
      });
    }
  });

  updateCandles(
    data.order.market,
    Number(data.order.price),
    Number(data.order.qty),
  );
}
