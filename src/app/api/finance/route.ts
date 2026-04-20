import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from "date-fns";

// Mapeador robusto para garantir a separação total dos meios de pagamento
const paymentMethodMap: Record<string, string> = {
  // Cartão de Crédito
  "CARD": "Cartão de Crédito",
  "CREDIT_CARD": "Cartão de Crédito",
  "CREDITO": "Cartão de Crédito",
  "CARTAO_CREDITO": "Cartão de Crédito",
  "PENDING": "Cartão de Crédito",
  "PENDENTE": "Cartão de Crédito",

  // Cartão de Débito
  "DEBIT_CARD": "Cartão de Débito",
  "DEBITO": "Cartão de Débito",
  "CARTAO_DEBITO": "Cartão de Débito",

  // Dinheiro (Separado)
  "CASH": "Dinheiro",
  "MONEY": "Dinheiro",
  "DINHEIRO": "Dinheiro",
  "ESPECIE": "Dinheiro",
  "PHYSICAL_MONEY": "Dinheiro",

  // Pix
  "PIX": "Pix",
  "INSTANT_PAY": "Pix",
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const startDate = from ? startOfDay(parseISO(from)) : startOfDay(new Date());
    const endDate = to ? endOfDay(parseISO(to)) : endOfDay(new Date());

    const orders = await (prisma as any).order.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["DELIVERED", "DONE"] }
      },
      include: {
        items: { include: { product: true } }
      }
    });

    let totalRevenue = 0;
    const paymentMethods: Record<string, number> = {};
    const productStats: Record<string, { name: string, quantity: number, total: number }> = {};
    const customerStats: Record<string, { name: string, email: string, count: number, total: number }> = {};
    
    const dailyDataMap: Record<string, number> = {};
    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    interval.forEach(day => {
      dailyDataMap[format(day, "yyyy-MM-dd")] = 0;
    });

    orders.forEach((order: any) => {
      totalRevenue += order.total;
      
      const dayKey = format(order.createdAt, "yyyy-MM-dd");
      if (dailyDataMap[dayKey] !== undefined) {
        dailyDataMap[dayKey] += order.total;
      }

      // Lógica de Separação Aprimorada
      const rawMethod = (order.paymentMethod || "").toUpperCase().trim();
      let methodLabel = "Outros";

      if (paymentMethodMap[rawMethod]) {
        methodLabel = paymentMethodMap[rawMethod];
      } else if (rawMethod.includes("CARTAO") || rawMethod.includes("CARD")) {
        methodLabel = "Cartão de Crédito";
      } else if (rawMethod.includes("DINHEIRO") || rawMethod.includes("CASH")) {
        methodLabel = "Dinheiro";
      } else if (rawMethod.includes("PIX")) {
        methodLabel = "Pix";
      } else {
        // Se ainda assim não soubermos, e o usuário pediu crédito no lugar do pendente
        methodLabel = "Cartão de Crédito";
      }
      
      paymentMethods[methodLabel] = (paymentMethods[methodLabel] || 0) + order.total;

      const customerKey = order.customerEmail || order.customerName || "Anônimo";
      if (!customerStats[customerKey]) {
        customerStats[customerKey] = { 
          name: order.customerName || "Cliente", 
          email: order.customerEmail || "", 
          count: 0, 
          total: 0 
        };
      }
      customerStats[customerKey].count += 1;
      customerStats[customerKey].total += order.total;

      order.items?.forEach((item: any) => {
        const prodId = item.productId;
        if (!productStats[prodId]) {
          productStats[prodId] = { name: item.product?.name || "Desconhecido", quantity: 0, total: 0 };
        }
        productStats[prodId].quantity += item.quantity;
        productStats[prodId].total += (item.price * item.quantity);
      });
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        orderCount: orders.length,
        averageTicket: orders.length > 0 ? totalRevenue / orders.length : 0,
      },
      dailySales: Object.entries(dailyDataMap).map(([date, value]) => ({ 
        date: format(parseISO(date), "dd/MM"), 
        value 
      })),
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({ name, Valor: value })),
      topProducts: Object.values(productStats).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      lessSold: Object.values(productStats).sort((a, b) => a.quantity - b.quantity).slice(0, 10),
      topCustomers: Object.values(customerStats).sort((a, b) => b.total - a.total).slice(0, 10),
    });

  } catch (error: any) {
    console.error("FINANCE_API_ERROR:", error);
    return NextResponse.json({ error: "Erro financeiro: " + error.message }, { status: 500 });
  }
}
