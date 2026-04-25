import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes (Cuidado em produção!)
  await prisma.orderitem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.platform_transaction.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // Criar Super Admin solicitado
  const hashedPassword = await bcrypt.hash("@Carlos@1", 12);

  const admin = await prisma.user.create({
    data: {
      id: "admin_carlos_id", // O modelo user exige ID manual no schema atual
      name: "Carlos Henry",
      email: "carloshenrychgs@gmail.com",
      password: hashedPassword,
      role: "SUPERADMIN",
      updatedAt: new Date(),
    },
  });

  console.log("✅ Super Admin criado: carloshenrychgs@gmail.com");

  // Criar loja demo associada ao admin
  const store = await prisma.store.create({
    data: {
      slug: "loja-demo",
      name: "Loja Demonstrativa",
      description: "Uma loja de exemplo para testes do sistema.",
      whatsapp: "5511999998888",
      address: "Rua Exemplo, 123",
      city: "São Paulo",
      state: "SP",
      isOpen: true,
      primaryColor: "#f97316",
      userId: admin.id,
      updatedAt: new Date(),
    },
  });

  // Criar assinatura ativa para a loja (para não bloquear o acesso)
  const plan = await prisma.plan.findFirst() || await prisma.plan.create({
    data: {
      name: "Plano Profissional",
      price: 49.90,
      description: "Acesso completo",
      updatedAt: new Date(),
    }
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.subscription.create({
    data: {
      storeId: store.id,
      planId: plan.id,
      status: "ACTIVE",
      expiresAt: expiresAt,
      updatedAt: new Date(),
    }
  });

  console.log("✅ Loja Demo e Assinatura criadas com sucesso!");
  console.log("📧 Login: carloshenrychgs@gmail.com | Senha: @Carlos@1");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
