import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const orders = await prisma.order.findMany();
    if (orders.length > 0) {
      const orderId = orders[0].id;
      console.log("TESTING UPDATE ON ORDER:", orderId);
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderitem: {
            create: {
              productId: "any", // Will fail on FK but we want to see the validation error
              quantity: 1,
              price: 10,
            }
          }
        }
      });
      console.log("UPDATED:", updated);
    }
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
