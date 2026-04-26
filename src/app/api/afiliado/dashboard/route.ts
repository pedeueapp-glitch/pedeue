export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const affiliate = await prisma.platform_affiliate.findUnique({
      where: { userId: session.user.id },
      include: {
        stores: {
          select: {
            id: true,
            isActive: true,
            subscription: { select: { status: true } },
          },
        },
        commissions: {
          select: { amount: true, status: true },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const totalStores = affiliate.stores.length;
    const activeStores = affiliate.stores.filter(
      (s) => s.isActive && s.subscription?.status === "ACTIVE"
    ).length;
    const totalReceived = affiliate.commissions
      .filter((c) => c.status === "PAID")
      .reduce((acc, c) => acc + c.amount, 0);
    const pendingBalance = affiliate.commissions
      .filter((c) => c.status === "PENDING")
      .reduce((acc, c) => acc + c.amount, 0);

    return NextResponse.json({
      totalStores,
      activeStores,
      totalReceived,
      pendingBalance,
      commissionRate: affiliate.commissionRate,
    });
  } catch (error) {
    console.error("[AFILIADO/DASHBOARD]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
