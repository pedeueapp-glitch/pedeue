const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await hash("123456", 12);

  // 1. Criar SuperAdmin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      email: "admin@admin.com",
      name: "Super Admin",
      password,
      role: "SUPERADMIN",
    },
  });

  // 2. Criar Plano Profissional
  const proPlan = await prisma.plan.upsert({
    where: { id: "clpro123" },
    update: {},
    create: {
      id: "clpro123",
      name: "Plano Profissional",
      description: "Ideal para lanchonetes em crescimento",
      price: 49.90,
      maxProducts: 100,
    },
  });

  // 3. Criar Lojista de Exemplo
  const merchant = await prisma.user.upsert({
    where: { email: "loja@exemplo.com" },
    update: {},
    create: {
      email: "loja@exemplo.com",
      name: "João do Burger",
      password,
      role: "ADMIN",
    },
  });

  // 4. Criar Loja
  const store = await prisma.store.upsert({
    where: { slug: "burger-do-joao" },
    update: {},
    create: {
      name: "Burger do João",
      slug: "burger-do-joao",
      userId: merchant.id,
      whatsapp: "5511999999999",
      isActive: true,
      description: "Os melhores hambúrgueres artesanais da região!",
      logoUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80",
    },
  });

  // 5. Criar Categorias
  const catBurger = await prisma.category.create({
    data: { name: "Hambúrgueres", emoji: "🍔", storeId: store.id }
  });

  const catBebidas = await prisma.category.create({
    data: { name: "Bebidas", emoji: "🥤", storeId: store.id }
  });

  // 6. Criar Produto com Adicionais (O PODER DO SISTEMA)
  const product = await prisma.product.create({
    data: {
      name: "Shallom X-Tudo",
      description: "Carne 180g, muito queijo, bacon crocante e maionese da casa.",
      price: 32.90,
      categoryId: catBurger.id,
      storeId: store.id,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
      optionGroups: {
        create: [
          {
            name: "Escolha o Pão",
            minChoices: 1,
            maxChoices: 1,
            options: {
              create: [
                { name: "Pão Australiano", price: 0 },
                { name: "Pão de Brioche", price: 0 }
              ]
            }
          },
          {
            name: "Adicionais Extras",
            minChoices: 0,
            maxChoices: 3,
            options: {
              create: [
                { name: "Bacon Extra", price: 4.50 },
                { name: "Cheddar Cremoso", price: 3.00 },
                { name: "Ovo", price: 2.50 }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
