import { prisma } from "db";
import type { CancelOrderResponseData } from "types/receiver";
import type { orderStatus } from "../../../packages/db/generated/prisma/enums";

export async function cancelOrder(data: CancelOrderResponseData) {
  console.log("pushing cancel order response to DB: ", data);
  if (!data?.order?.orderId) return;

  const status = (data.order.status || "Cancel") as orderStatus;
  const filledQuantity = data.order.filledQty || "0";

  await prisma.orders.updateMany({
    where: {
      id: data.order.orderId,
    },
    data: {
      status,
      filledQuantity,
    },
  });
}
