import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Busca o caixa do dia ou o último aberto
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Busca o caixa mais recente
    const cashier = await (prisma as any).cashiersession.findFirst({
      where: { storeId: store.id },
      orderBy: { openedAt: "desc" }
    });

    if (!cashier) return NextResponse.json({ cashier: null });

    // Verifica se o caixa do hoje está aberto
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cashierDate = new Date(cashier.openedAt);
    cashierDate.setHours(0, 0, 0, 0);
    const isToday = cashierDate.getTime() === today.getTime();

    return NextResponse.json({ cashier, isToday });
  } catch (error: any) {
    console.error("CASHIER_GET_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Abre ou fecha o caixa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const { action, openingBalance } = await req.json();

    if (action === "OPEN") {
      // Fecha qualquer caixa anterior que ainda esteja aberto
      await (prisma as any).cashiersession.updateMany({
        where: { storeId: store.id, status: "OPEN" },
        data: { status: "CLOSED", closedAt: new Date() }
      });

      const cashier = await (prisma as any).cashiersession.create({
        data: {
          id: `cs_${Date.now()}`,
          storeId: store.id,
          status: "OPEN",
          openedAt: new Date(),
          openingBalance: openingBalance || 0,
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ cashier });
    }

    if (action === "CLOSE") {
      const cashier = await (prisma as any).cashiersession.findFirst({
        where: { storeId: store.id, status: "OPEN" },
        orderBy: { openedAt: "desc" }
      });
      if (!cashier) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

      const updated = await (prisma as any).cashiersession.update({
        where: { id: cashier.id },
        data: { status: "CLOSED", closedAt: new Date(), updatedAt: new Date() }
      });
      return NextResponse.json({ cashier: updated });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("CASHIER_POST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
