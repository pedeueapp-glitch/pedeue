import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = "demo@lanchonete.com";
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const hashedPassword = await bcrypt.hash("@Demo123", 10);
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Demo Lanchonete",
        email,
        password: hashedPassword,
        role: "ADMIN",
        updatedAt: new Date()
      }
    });
  }

  // Vinculando ao primeiro plano que existir
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: { name: "Plano Elite", price: 97.00, features: "..." }
    });
  }

  // Deleta do banco se ja existir pra não dar conflito (recriação limpa)
  await prisma.store.deleteMany({ where: { slug: "lanchonete-demo" } });

  const storeId = randomUUID();

  const store = await prisma.store.create({
    data: {
      id: storeId,
      name: "Smash Burger Lanchonete",
      slug: "lanchonete-demo",
      description: "A melhor hamburgueria artesanal da sua região! Sabor de verdade, entregue rápido e com qualidade premium.",
      logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80",
      primaryColor: "#9333ea", 
      whatsapp: "5511999999999",
      isOpen: true,
      isActive: true,
      userId: user.id,
      subscription: {
        create: {
          planId: plan.id,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      category: {
        create: [
          {
            name: "Lanches Especiais",
            isActive: true,
            position: 1,
            updatedAt: new Date(),
            product: {
              create: [
                {
                  id: randomUUID(),
                  storeId,
                  name: "Ultra Smash Bacon",
                  description: "Pão brioche fofinho, 2x smash burger de 80g blend angus, muito queijo cheddar, bacon artesanal defumado e maionese secreta da casa.",
                  price: 34.90,
                  imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
                  isActive: true
                },
                {
                  id: randomUUID(),
                  storeId,
                  name: "PedeUe Chicken",
                  description: "Pão brioche selado na manteiga, frango sobrecoxa empanada super crocante, alface americana americana, picles e maionese defumada.",
                  price: 28.90,
                  imageUrl: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=80",
                  isActive: true
                }
              ]
            }
          },
          {
            name: "Porções & Acompanhamentos",
            isActive: true,
            position: 2,
            updatedAt: new Date(),
            product: {
              create: [
                {
                  id: randomUUID(),
                  storeId,
                  name: "Fritas Rústicas Premium",
                  description: "Porção generosa de 300g de batatas rústicas com páprica picante, acompanha nossa exclusiva maionese trufada da casa.",
                  price: 18.00,
                  imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80",
                  isActive: true
                }
              ]
            }
          },
          {
            name: "Bebidas",
            isActive: true,
            position: 3,
            updatedAt: new Date(),
            product: {
              create: [
                {
                  id: randomUUID(),
                  storeId,
                  name: "Refrigerante Lata Estourando de Gelada",
                  description: "Coca-cola, Guaraná, Sprite... Você escolhe. Embalo pra viagem acompanhando seu pedido! (350ml)",
                  price: 6.50,
                  imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
                  isActive: true
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Demo store criada com sucesso:", store.slug);
}

main().catch(console.error).finally(() => prisma.$disconnect());
