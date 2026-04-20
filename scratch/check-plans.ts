import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.plan.findMany();
  console.log("PLANOS ENCONTRADOS:", JSON.stringify(plans, null, 2));
  process.exit(0);
}

checkPlans();
