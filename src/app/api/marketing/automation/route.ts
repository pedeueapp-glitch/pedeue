import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
  });

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Pegar todos os clientes que já pediram nesta loja
  const customers = await prisma.customer.findMany({
    where: {
      order: {
        some: { storeId: store.id }
      }
    },
    include: {
      order: {
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const now = new Date();
  
  const segmentation = customers.map(customer => {
    const totalOrders = customer.order.length;
    const lastOrderDate = customer.order[0]?.createdAt;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let level = "NOVO";
    if (totalOrders > 5 && daysSinceLastOrder < 15) level = "VIP";
    else if (totalOrders > 2 && daysSinceLastOrder < 30) level = "FREQUENTE";
    else if (daysSinceLastOrder > 30) level = "INATIVO";

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      totalOrders,
      lastOrderDate,
      daysSinceLastOrder,
      level
    };
  });

  // Filtrar para Re-engajamento (Inativos há mais de 15 dias)
  const reEngagement = segmentation.filter(c => c.daysSinceLastOrder >= 15);

  return NextResponse.json({
    segmentation,
    reEngagement
  });
}
