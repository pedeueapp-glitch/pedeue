import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const orders = await prisma.order.findMany();
    console.log("ORDERS COUNT:", orders.length);
    const waiters = await prisma.waiter.findMany();
    console.log("WAITERS COUNT:", waiters.length);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
