import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- DEBUG DE DADOS DO SISTEMA ---");
  
  const users = await prisma.user.count();
  const stores = await prisma.store.count();
  const categories = await prisma.category.count();
  const products = await prisma.product.count();

  console.log(`Total de Usuários: ${users}`);
  console.log(`Total de Lojas: ${stores}`);
  console.log(`Total de Categorias: ${categories}`);
  console.log(`Total de Produtos: ${products}`);

  console.log("\n--- LISTAGEM DE CATEGORIAS ---");
  const cats = await prisma.category.findMany({
    include: { store: true }
  });
  
  cats.forEach((c: any) => {
    console.log(`Categoria: ${c.name} | Loja: ${c.store?.name} (Slug: ${c.store?.slug})`);
  });

  console.log("\n--- ÚLTIMA LOJA CRIADA ---");
  const lastStore = await prisma.store.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });
  console.log(`Loja: ${lastStore?.name} | Dono (User Email): ${lastStore?.user?.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
