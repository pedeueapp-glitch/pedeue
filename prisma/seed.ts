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

  // Criar Categorias
  const catBurguers = await prisma.category.create({
    data: {
      name: "Hambúrgueres Artesanais",
      storeId: store.id,
      position: 0,
      updatedAt: new Date(),
    }
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: "Bebidas",
      storeId: store.id,
      position: 1,
      updatedAt: new Date(),
    }
  });

  // Criar Produtos
  await prisma.product.create({
    data: {
      id: "prod_classic_burger_id",
      name: "Classic Burger",
      description: "Pão brioche, blend 160g, queijo cheddar e maionese da casa.",
      price: 32.90,
      categoryId: catBurguers.id,
      storeId: store.id,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
      isActive: true,
      updatedAt: new Date(),
    }
  });

  await prisma.product.create({
    data: {
      id: "prod_bacon_bliss_id",
      name: "Bacon Bliss",
      description: "Para os amantes de bacon: muito bacon crocante e cebola caramelizada.",
      price: 38.90,
      categoryId: catBurguers.id,
      storeId: store.id,
      imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7143b?w=500",
      isActive: true,
      updatedAt: new Date(),
    }
  });

  await prisma.product.create({
    data: {
      id: "prod_coca_lata_id",
      name: "Coca-Cola Lata",
      description: "350ml bem gelada.",
      price: 6.00,
      categoryId: catBebidas.id,
      storeId: store.id,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
      isActive: true,
      updatedAt: new Date(),
    }
  });

  await prisma.product.create({
    data: {
      id: "prod_suco_laranja_id",
      name: "Suco de Laranja Natural",
      description: "500ml de pura fruta.",
      price: 12.00,
      categoryId: catBebidas.id,
      storeId: store.id,
      imageUrl: "https://images.unsplash.com/photo-1600271886342-dc672e273f59?w=500",
      isActive: true,
      updatedAt: new Date(),
    }
  });

  console.log("✅ Produtos e Categorias populados!");
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
