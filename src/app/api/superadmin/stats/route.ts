import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Médias e Totais Básicos
    const totalStores = await prisma.store.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "ACTIVE" }
    });

    const revenueData = await prisma.platform_transaction.aggregate({
      _sum: { amount: true },
      _avg: { amount: true }
    });

    const totalRevenue = revenueData._sum.amount || 0;
    const averageTicket = revenueData._avg.amount || 0;

    // 2. Gastos Totais (Com proteção caso a tabela não esteja no Client)
    let totalExpenses = 0;
    let recentExpenses: any[] = [];
    
    try {
      if ((prisma as any).platform_expense) {
        const expensesSum = await (prisma as any).platform_expense.aggregate({
          _sum: { amount: true }
        });
        totalExpenses = expensesSum._sum.amount || 0;

        recentExpenses = await (prisma as any).platform_expense.findMany({
          take: 5,
          orderBy: { date: "desc" }
        });
      }
    } catch (e) {
      console.warn("Tabela platform_expense ainda não reconhecida pelo Client.");
    }

    // 3. Transações Recentes
    const recentTransactions = await prisma.platform_transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true } } }
    });

    // 4. Dados para Gráfico (Últimos 6 meses)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthRevenue = await prisma.platform_transaction.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true }
      });

      let monthExpensesValue = 0;
      try {
        if ((prisma as any).platform_expense) {
          const monthExpenses = await (prisma as any).platform_expense.aggregate({
            where: { date: { gte: start, lte: end } },
            _sum: { amount: true }
          });
          monthExpensesValue = monthExpenses._sum.amount || 0;
        }
      } catch (e) {}

      chartData.push({
        name: formatMonth(date),
        receita: monthRevenue._sum.amount || 0,
        custo: monthExpensesValue,
        lucro: (monthRevenue._sum.amount || 0) - monthExpensesValue
      });
    }

    return NextResponse.json({
      totalStores,
      activeSubscriptions,
      totalRevenue,
      totalExpenses,
      averageTicket,
      recentTransactions,
      recentExpenses,
      chartData,
      netProfit: totalRevenue - totalExpenses
    });
  } catch (error) {
    console.error("STATS_API_ERROR:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

function formatMonth(date: Date) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return months[date.getMonth()];
}
