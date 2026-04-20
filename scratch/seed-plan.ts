import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlan() {
  const plan = await prisma.plan.create({
    data: {
      name: "Plano Profissional",
      description: "Acesso total a todas as ferramentas de delivery e PDV",
      price: 97.00,
      maxProducts: 500,
      isActive: true,
      features: JSON.stringify({
        PDV_SYSTEM: true,
        TABLE_MANAGEMENT: true,
        DIGITAL_MENU: true,
        REPORTS: true,
        COUPON_SYSTEM: true
      })
    }
  });
  console.log("PLANO CRIADO COM SUCESSO! ID:", plan.id);
  process.exit(0);
}

seedPlan();
