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
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const commissions = await prisma.affiliate_commission.findMany({
      where: { platformAffiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
    });

    // Enriquecer com nome da loja
    const enriched = await Promise.all(
      commissions.map(async (c) => {
        const store = await prisma.store.findUnique({
          where: { id: c.storeId },
          select: { name: true },
        });
        return { ...c, storeName: store?.name ?? "Loja removida" };
      })
    );

    const totalPaid = enriched.filter(c => c.status === "PAID").reduce((a: number, c: any) => a + c.amount, 0);
    const totalPending = enriched.filter(c => c.status === "PENDING").reduce((a: number, c: any) => a + c.amount, 0);

    return NextResponse.json({ commissions: enriched, totalPaid, totalPending });
  } catch (error) {
    console.error("[AFILIADO/FINANCEIRO]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
