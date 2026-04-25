import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo store...');

  // 1. Encontrar ou criar o plano
  let plan = await prisma.plan.findFirst({
    where: { name: { contains: 'PRATA' } }
  });

  if (!plan) {
    plan = await prisma.plan.findFirst();
  }

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'PLANO DEMO',
        price: 0,
        maxProducts: 100,
        features: JSON.stringify({
          PDV_SYSTEM: true,
          TABLE_MANAGEMENT: true,
          DIGITAL_MENU: true,
          WAITER_APP: true,
          DELIVERY_SYSTEM: true,
          COUPON_SYSTEM: true,
          AUTO_PRINT: true
        })
      }
    });
  }

  // 2. Criar Usuário Demo
  const email = 'demo@pedeue.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hashedPassword = await bcrypt.hash('pedeue123', 10);
    user = await prisma.user.create({
      data: {
        id: 'user_demo_id',
        name: 'Demonstração PedeUe',
        email,
        password: hashedPassword,
        role: 'USER',
        updatedAt: new Date()
      }
    });
  }

  // 3. Criar a Loja
  const slug = 'pedeue-burguer';
  
  // Limpar loja antiga se existir
  const existingStore = await prisma.store.findUnique({ where: { slug } });
  if (existingStore) {
    await prisma.store.delete({ where: { slug } });
  }

  const store = await prisma.store.create({
    data: {
      id: 'store_demo_id',
      name: 'PedeUe Burguer 🍔',
      slug,
      description: 'O melhor hambúrguer artesanal da região. Ingredientes selecionados e sabor inconfundível!',
      whatsapp: '5511999999999',
      logo: '/api/images?file=demo/logo.png',
      coverImage: '/api/images?file=demo/cover.png',
      primaryColor: '#8b5cf6',
      isOpen: true,
      isActive: true,
      userId: user.id,
      storeType: 'RESTAURANT',
      deliveryTime: '30-45',
      deliveryFee: 5.0,
      minOrderValue: 20.0,
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      updatedAt: new Date(),
      subscription: {
        create: {
          planId: plan.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
          status: 'ACTIVE'
        }
      }
    }
  });

  // 4. Criar Categorias
  const catBurguers = await prisma.category.create({
    data: {
      name: 'Hambúrgueres Artesanais',
      emoji: '🍔',
      storeId: store.id,
      position: 1,
      updatedAt: new Date()
    }
  });

  const catAcomp = await prisma.category.create({
    data: {
      name: 'Acompanhamentos',
      emoji: '🍟',
      storeId: store.id,
      position: 2,
      updatedAt: new Date()
    }
  });

  const catDrinks = await prisma.category.create({
    data: {
      name: 'Bebidas Geladas',
      emoji: '🥤',
      storeId: store.id,
      position: 3,
      updatedAt: new Date()
    }
  });

  // 5. Criar Produtos
  const products = [
    {
      name: 'PedeUe Monster Burger',
      description: 'Pão de brioche, 2 blends de 160g, muito queijo cheddar, bacon crocante, cebola caramelizada e molho especial.',
      price: 42.90,
      categoryId: catBurguers.id,
      imageUrl: '/api/images?file=demo/burger.png',
      position: 1
    },
    {
      name: 'Classic Smash',
      description: 'Pão, blend smash 80g, queijo prato, picles e maionese da casa.',
      price: 24.90,
      categoryId: catBurguers.id,
      imageUrl: '/api/images?file=demo/burger.png',
      position: 2
    },
    {
      name: 'Veggie Supreme',
      description: 'Hambúrguer de grão de bico, queijo muçarela, alface, tomate e maionese verde.',
      price: 34.90,
      categoryId: catBurguers.id,
      imageUrl: '/api/images?file=demo/burger.png',
      position: 3
    },
    {
      name: 'Batata Rústica Grande',
      description: 'Porção de 400g de batatas selecionadas com alecrim e páprica.',
      price: 18.00,
      categoryId: catAcomp.id,
      imageUrl: null,
      position: 1
    },
    {
      name: 'Nuggets de Frango (10 unidades)',
      description: 'Acompanha molho barbecue.',
      price: 22.00,
      categoryId: catAcomp.id,
      imageUrl: null,
      position: 2
    },
    {
      name: 'Coca-Cola 350ml',
      description: 'Lata bem gelada.',
      price: 6.50,
      categoryId: catDrinks.id,
      imageUrl: null,
      position: 1
    },
    {
      name: 'Suco Natural de Laranja',
      description: '500ml de pura fruta.',
      price: 12.00,
      categoryId: catDrinks.id,
      imageUrl: null,
      position: 2
    }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        ...p,
        storeId: store.id,
        isActive: true,
        inStock: true,
        updatedAt: new Date()
      }
    });
  }

  console.log('✅ Demo store seeded successfully!');
  console.log('Slug: /pedeue-burguer');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
