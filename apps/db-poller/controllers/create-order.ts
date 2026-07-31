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
            quantity: fill.qty,
            market: fill.market,
          };
        })
      : null;
  const order = {
    id: data.order.orderId,
    quantity: data.order.qty,
    filledQuantity: data.order.filledQty || "0",
    price: data.order.price,
    side: data.order.side.toLocaleLowerCase() as side,
    type: data.order.type as type,
    status: (data.order.status || "open") as orderStatus,
    userId: data.userId,
    market: data.order.market,
  };

  await prisma.$transaction(async (tx) => {
    await tx.orders.create({
      data: order,
    });

    if (fills?.length) {
      await tx.fills.createMany({
        data: fills,
      });

      // Group fills by maker order ID to update maker orders in DB
      const makerFillsMap = new Map<string, bigint>();
      for (const fill of data.fills) {
        const makerOrderId =
          fill.makerId === fill.LongUserId ? fill.buyOrderId : fill.sellOrderId;
        if (makerOrderId) {
          const prev = makerFillsMap.get(makerOrderId) || 0n;
          makerFillsMap.set(makerOrderId, prev + BigInt(fill.qty));
        }
      }

      for (const [makerOrderId, fillQty] of makerFillsMap.entries()) {
        const makerOrder = await tx.orders.findUnique({
          where: { id: makerOrderId },
        });

        if (makerOrder) {
          const currentFilled = BigInt(makerOrder.filledQuantity || "0");
          const newFilled = currentFilled + fillQty;
          const totalQty = BigInt(makerOrder.quantity);
          const newStatus: orderStatus =
            newFilled >= totalQty ? "Filled" : "partiallyFilled";

          await tx.orders.update({
            where: { id: makerOrderId },
            data: {
              filledQuantity: newFilled.toString(),
              status: newStatus,
            },
          });
        }
      }
    }
  });

  updateCandles(
    data.order.market,
    Number(data.order.price),
    Number(data.order.qty),
  );
}
