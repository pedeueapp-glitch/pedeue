import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format, getHours, getDay } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
  });

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Pegar pedidos dos últimos 30 dias
  const last30Days = subDays(new Date(), 30);
  
  const orders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      createdAt: { gte: last30Days },
      status: { not: 'CANCELED' }
    },
    select: {
      createdAt: true,
      total: true
    }
  });

  // Processar Heatmap (Horas vs Dias da Semana)
  // dias: 0-6 (dom-sab), horas: 0-23
  const heatmap: any = Array.from({ length: 7 }, () => Array(24).fill(0));
  const hourlyPeak: any = Array(24).fill(0);
  const dailyPeak: any = Array(7).fill(0);

  orders.forEach(order => {
    const hour = getHours(order.createdAt);
    const day = getDay(order.createdAt);
    
    heatmap[day][hour] += 1;
    hourlyPeak[hour] += 1;
    dailyPeak[day] += 1;
  });

  return NextResponse.json({
    heatmap,
    hourlyPeak,
    dailyPeak
  });
}
