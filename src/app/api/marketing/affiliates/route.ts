import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
  });

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const affiliates = await prisma.affiliate.findMany({
    where: { storeId: store.id },
    include: {
      orders: {
        where: { status: { not: "CANCELED" } },
        select: { total: true, createdAt: true }
      },
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatted = affiliates.map(aff => {
    const pendingOrders = aff.orders.filter(o => o.createdAt >= aff.lastResetAt);
    const revenue = pendingOrders.reduce((sum, o) => sum + o.total, 0);
    const commissionValue = (revenue * aff.commission) / 100;

    const { orders, ...rest } = aff;

    return {
      ...rest,
      revenue,
      commissionValue,
      pendingOrdersCount: pendingOrders.length,
      totalOrdersCount: aff._count.orders
    };
  });

  return NextResponse.json(formatted);

}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
  });

  const { name, code, commission } = await req.json();

  const affiliate = await prisma.affiliate.create({
    data: {
      name,
      code,
      commission: parseFloat(commission),
      storeId: store!.id
    }
  });

  return NextResponse.json(affiliate);
}

export async function PATCH(req: Request) {
  const { id, isActive, reset, name, code, commission } = await req.json();
  
  if (reset) {
    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: { lastResetAt: new Date() }
    });
    return NextResponse.json(affiliate);
  }

  const affiliate = await prisma.affiliate.update({
    where: { id },
    data: { 
      isActive,
      name,
      code,
      commission: commission ? parseFloat(commission) : undefined
    }
  });
  return NextResponse.json(affiliate);
}



export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await prisma.affiliate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
