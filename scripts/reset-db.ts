import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO RESET DO BANCO DE DADOS ---');

  try {
    // 1. Limpar dados (Ordem inversa das dependências)
    console.log('Limpando tabelas...');
    
    // Tabelas de Nível 3 (Dependentes de tabelas vinculadas a Store/Product)
    await prisma.option.deleteMany();
    await prisma.orderitem.deleteMany();
    await prisma.product_variant.deleteMany();

    // Tabelas de Nível 2 (Dependentes de Store/Product)
    await prisma.optiongroup.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.deliveryarea.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.table.deleteMany();
    await prisma.waiter.deleteMany();
    await prisma.cashiersession.deleteMany();
    await prisma.pdvsettings.deleteMany();
    await prisma.platform_transaction.deleteMany();
    await prisma.subscription.deleteMany();

    // Tabelas de Nível 1 (Dependentes de User/Plan)
    await prisma.store.deleteMany();
    
    // Tabelas Base
    await prisma.platform_expense.deleteMany();
    await prisma.platformcity.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Banco de dados limpo com sucesso.');

    // 2. Criar Plano Inicial (Obrigatório para assinaturas)
    console.log('Criando plano master...');
    const plan = await prisma.plan.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Plano Master Professional',
        description: 'Acesso total a todos os recursos do sistema.',
        price: 0,
        maxProducts: 9999,
        isActive: true,
        updatedAt: new Date()
      }
    });

    // 3. Criar SuperAdmin
    console.log('Criando conta SuperAdmin...');
    const hashedPassword = await bcrypt.hash('@Carlos@1', 10);
    const superAdmin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Carlos Henry',
        email: 'carloshenrychgs@gmail.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        updatedAt: new Date()
      }
    });

    // 4. Criar Loja vinculada ao SuperAdmin
    console.log('Criando loja inicial...');
    const store = await prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Minha Loja Principal',
        slug: 'pedeue-loja',
        whatsapp: '00000000000',
        userId: superAdmin.id,
        updatedAt: new Date()
      }
    });

    // 5. Criar Assinatura para a loja
    console.log('Vinculando assinatura...');
    await prisma.subscription.create({
      data: {
        id: crypto.randomUUID(),
        storeId: store.id,
        planId: plan.id,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        updatedAt: new Date()
      }
    });

    console.log('--- SETUP CONCLUÍDO COM SUCESSO ---');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Senha: @Carlos@1`);
    console.log(`Loja: ${store.name} (${store.slug})`);

  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
