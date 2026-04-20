import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuário merchant demo
  const hashedPassword = await bcrypt.hash("demo123456", 12);

  const superadmin = await prisma.user.create({
    data: {
      name: "Administrador Geral",
      email: "admin@saas.com",
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "José Silva - Shallom",
      email: "demo@shallom.com",
      password: hashedPassword,
    },
  });

  // Criar loja demo
  const store = await prisma.store.create({
    data: {
      slug: "shallom-supermercado",
      name: "Shallom Supermercado e Padaria",
      description:
        "Seu supermercado e padaria de confiança com os melhores produtos frescos e artesanais da cidade.",
      whatsapp: "5511999998888",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      deliveryFee: 5.0,
      minOrderValue: 20.0,
      isOpen: true,
      primaryColor: "#f97316",
      openingHours: {
        segunda: { open: "07:00", close: "22:00", isOpen: true },
        terca: { open: "07:00", close: "22:00", isOpen: true },
        quarta: { open: "07:00", close: "22:00", isOpen: true },
        quinta: { open: "07:00", close: "22:00", isOpen: true },
        sexta: { open: "07:00", close: "22:00", isOpen: true },
        sabado: { open: "08:00", close: "20:00", isOpen: true },
        domingo: { open: "08:00", close: "18:00", isOpen: true },
      },
      userId: user.id,
    },
  });

  // Criar categorias
  const padaria = await prisma.category.create({
    data: {
      name: "Padaria",
      emoji: "🥖",
      position: 1,
      storeId: store.id,
    },
  });

  const frios = await prisma.category.create({
    data: {
      name: "Frios e Laticínios",
      emoji: "🧀",
      position: 2,
      storeId: store.id,
    },
  });

  const bebidas = await prisma.category.create({
    data: {
      name: "Bebidas",
      emoji: "🥤",
      position: 3,
      storeId: store.id,
    },
  });

  const hortifruti = await prisma.category.create({
    data: {
      name: "Hortifruti",
      emoji: "🥬",
      position: 4,
      storeId: store.id,
    },
  });

  const mercearia = await prisma.category.create({
    data: {
      name: "Mercearia",
      emoji: "🛒",
      position: 5,
      storeId: store.id,
    },
  });

  // Produtos da Padaria
  await prisma.product.createMany({
    data: [
      {
        name: "Pão Francês",
        description: "Pão francês crocante fresquinho, assado na hora. Unidade.",
        price: 0.85,
        categoryId: padaria.id,
        storeId: store.id,
        position: 1,
      },
      {
        name: "Pão de Queijo (6un)",
        description: "Pão de queijo artesanal, crocante por fora e macio por dentro. Pacote com 6 unidades.",
        price: 12.9,
        categoryId: padaria.id,
        storeId: store.id,
        position: 2,
      },
      {
        name: "Bolo de Fubá com Goiabada",
        description: "Bolo caseiro de fubá com goiabada, receita da vovó. Fatia generosa.",
        price: 8.5,
        categoryId: padaria.id,
        storeId: store.id,
        position: 3,
      },
      {
        name: "Croissant de Chocolate",
        description: "Croissant amanteigado recheado com chocolate belga cremoso.",
        price: 6.9,
        categoryId: padaria.id,
        storeId: store.id,
        position: 4,
      },
    ],
  });

  // Produtos Frios
  await prisma.product.createMany({
    data: [
      {
        name: "Queijo Minas Frescal 500g",
        description: "Queijo Minas fresco e cremoso, produção artesanal local. 500g.",
        price: 18.9,
        categoryId: frios.id,
        storeId: store.id,
        position: 1,
      },
      {
        name: "Presunto Cozido Fatiado 200g",
        description: "Presunto cozido fatiado, sem conservantes, ideal para lanches.",
        price: 11.5,
        categoryId: frios.id,
        storeId: store.id,
        position: 2,
      },
      {
        name: "Iogurte Natural Integral 500ml",
        description: "Iogurte natural integral cremoso, sem adição de açúcar.",
        price: 9.9,
        categoryId: frios.id,
        storeId: store.id,
        position: 3,
      },
      {
        name: "Manteiga com Sal 200g",
        description: "Manteiga de alta qualidade com sal marinho. Embalagem 200g.",
        price: 14.9,
        categoryId: frios.id,
        storeId: store.id,
        position: 4,
      },
    ],
  });

  // Bebidas
  await prisma.product.createMany({
    data: [
      {
        name: "Suco de Laranja Natural 500ml",
        description: "Suco de laranja espremido na hora, sem conservantes. 500ml.",
        price: 8.0,
        categoryId: bebidas.id,
        storeId: store.id,
        position: 1,
      },
      {
        name: "Refrigerante Coca-Cola 2L",
        description: "Coca-Cola gelada 2 litros. Original.",
        price: 11.9,
        categoryId: bebidas.id,
        storeId: store.id,
        position: 2,
      },
      {
        name: "Água Mineral 1,5L",
        description: "Água mineral natural sem gás. Garrafa 1,5 litro.",
        price: 3.5,
        categoryId: bebidas.id,
        storeId: store.id,
        position: 3,
      },
      {
        name: "Cerveja Artesanal 600ml",
        description: "Cerveja artesanal IPA gelada. Garrafa 600ml.",
        price: 18.0,
        categoryId: bebidas.id,
        storeId: store.id,
        position: 4,
      },
    ],
  });

  // Hortifruti
  await prisma.product.createMany({
    data: [
      {
        name: "Tomate Italiano 1kg",
        description: "Tomate italiano selecionado, firme e saboroso. 1kg.",
        price: 7.9,
        categoryId: hortifruti.id,
        storeId: store.id,
        position: 1,
      },
      {
        name: "Alface Crespa",
        description: "Alface crespa fresca, lavada e higienizada.",
        price: 3.5,
        categoryId: hortifruti.id,
        storeId: store.id,
        position: 2,
      },
    ],
  });

  // Mercearia
  await prisma.product.createMany({
    data: [
      {
        name: "Arroz Branco 5kg",
        description: "Arroz branco tipo 1, polido, grãos selecionados. Embalagem 5kg.",
        price: 24.9,
        categoryId: mercearia.id,
        storeId: store.id,
        position: 1,
      },
      {
        name: "Feijão Carioca 1kg",
        description: "Feijão carioca tipo 1, grãos graúdos e sadios. 1kg.",
        price: 8.9,
        categoryId: mercearia.id,
        storeId: store.id,
        position: 2,
      },
    ],
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log("👑 SuperAdmin: admin@saas.com | Senha: demo123456");
  console.log("📧 Login demo: demo@shallom.com | Senha: demo123456");
  console.log("🏪 Loja: /loja/shallom-supermercado");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
