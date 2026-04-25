import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. LTV Médio
  const totalRevenue = await prisma.platform_transaction.aggregate({
    _sum: { amount: true },
    where: { status: 'paid' }
  });
  
  const totalStores = await prisma.store.count();
  const averageLTV = totalStores > 0 ? (totalRevenue._sum.amount || 0) / totalStores : 0;

  // 2. Churn Rate
  const thirtyDaysAgo = subMonths(new Date(), 1);
  const churnedStores = await prisma.subscription.count({
    where: {
      expiresAt: { lt: new Date(), gt: thirtyDaysAgo },
      status: { not: 'ACTIVE' }
    }
  });
  const churnRate = totalStores > 0 ? (churnedStores / totalStores) * 100 : 0;

  // 3. Receita por Mês
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: date.toLocaleString('pt-BR', { month: 'short' })
    };
  }).reverse();

  const revenueHistory = await Promise.all(last6Months.map(async (m) => {
    const revenue = await prisma.platform_transaction.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: m.start, lte: m.end },
        status: 'paid'
      }
    });
    return {
      month: m.label,
      revenue: revenue._sum.amount || 0
    };
  }));

  return NextResponse.json({
    ltv: averageLTV.toFixed(2),
    churnRate: churnRate.toFixed(1),
    revenueHistory,
    totalActiveStores: await prisma.store.count({ where: { isActive: true } }),
    pendingTickets: await prisma.support_ticket.count({ where: { status: 'OPEN' } })
  });
}
