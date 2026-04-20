import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: "Intervalo de datas necessário" }, { status: 400 });
    }

    const startDate = startOfDay(parseISO(startDateParam));
    const endDate = endOfDay(parseISO(endDateParam));

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Buscar pedidos no intervalo
    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: { in: ["DONE", "DELIVERED"] }, // Aceitar ambos os status concluídos
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        paymentMethod: true,
        createdAt: true,
      }
    });

    // Calcular Totais por Método
    const byMethod = {
      PIX: 0,
      CARD: 0,
      CASH: 0,
    };

    // Agrupar por dia para o gráfico
    const salesByDay: Record<string, number> = {};

    orders.forEach(order => {
      const method = order.paymentMethod as keyof typeof byMethod;
      if (byMethod[method] !== undefined) {
        byMethod[method] += order.total;
      }

      const day = order.createdAt.toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + order.total;
    });

    const dailyChartData = Object.entries(salesByDay)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const methodChartData = [
      { name: "Pix", value: byMethod.PIX, fill: "#f97316" },
      { name: "Cartão", value: byMethod.CARD, fill: "#0f172a" },
      { name: "Dinheiro", value: byMethod.CASH, fill: "#22c55e" },
    ].filter(i => i.value > 0);

    return NextResponse.json({
      summary: {
        totalVendido: orders.reduce((acc, curr) => acc + curr.total, 0),
        totalPedidos: orders.length,
        porMetodo: byMethod,
      },
      charts: {
        daily: dailyChartData,
        methods: methodChartData
      }
    });
  } catch (error: any) {
    console.error("ERRO METRICS API:", error);
    return NextResponse.json({ error: "Erro ao carregar métricas" }, { status: 500 });
  }
}
