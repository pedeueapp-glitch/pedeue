
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const openOrders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ["DONE", "DELIVERED", "CANCELED"]
      }
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      store: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  console.log("=== PEDIDOS EM ABERTO NO SISTEMA ===");
  if (openOrders.length === 0) {
    console.log("Nenhum pedido em aberto encontrado.");
  } else {
    openOrders.forEach(o => {
      console.log(`Loja: ${o.store.name} (${o.store.slug}) | Pedido: #${o.orderNumber} | Status: ${o.status}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
