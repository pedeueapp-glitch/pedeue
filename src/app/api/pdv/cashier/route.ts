export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Busca o caixa do dia ou o último aberto (ou histórico se solicitado)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const history = searchParams.get("history") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (history) {
      const where: any = { storeId: store.id };
      if (dateFrom || dateTo) {
        where.openedAt = {};
        if (dateFrom) where.openedAt.gte = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          where.openedAt.lte = end;
        }
      }

      const sessions = await (prisma as any).cashiersession.findMany({
        where,
        orderBy: { openedAt: "desc" }
      });
      return NextResponse.json(sessions);
    }

    // Busca o caixa mais recente para o PDV (comportamento padrão)
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

// POST: Abre, fecha o caixa ou adiciona retirada
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const { action, openingBalance, withdrawal, closingNotes } = await req.json();

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
          withdrawals: "[]",
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ cashier });
    }

    if (action === "WITHDRAWAL") {
      // Adicionar retirada ao caixa atual
      const cashier = await (prisma as any).cashiersession.findFirst({
        where: { storeId: store.id, status: "OPEN" },
        orderBy: { openedAt: "desc" }
      });
      if (!cashier) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

      const currentWithdrawals = cashier.withdrawals ? JSON.parse(cashier.withdrawals) : [];
      const newWithdrawal = {
        id: `w_${Date.now()}`,
        reason: withdrawal.reason,
        amount: withdrawal.amount,
        at: new Date().toISOString()
      };
      currentWithdrawals.push(newWithdrawal);

      const updated = await (prisma as any).cashiersession.update({
        where: { id: cashier.id },
        data: { withdrawals: JSON.stringify(currentWithdrawals), updatedAt: new Date() }
      });
      return NextResponse.json({ cashier: updated, withdrawal: newWithdrawal });
    }

    if (action === "CLOSE") {
      const cashier = await (prisma as any).cashiersession.findFirst({
        where: { storeId: store.id, status: "OPEN" },
        orderBy: { openedAt: "desc" }
      });
      if (!cashier) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

      // Buscar pedidos do período do caixa para gerar relatório
      const openedAt = new Date(cashier.openedAt);
      const now = new Date();

      // Verificação de comandas em aberto para aquele turno
      const openComandas = await prisma.order.findMany({
        where: {
          storeId: store.id,
          orderType: "DINING_IN",
          createdAt: { gte: openedAt },
          status: { notIn: ["DELIVERED", "DONE", "CANCELED"] }
        }
      });

      if (openComandas.length > 0) {
        return NextResponse.json({ 
          error: `Existem ${openComandas.length} comandas em aberto. É necessário finalizar todas as comandas antes do fechamento.` 
        }, { status: 400 });
      }

      const orders = await prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: openedAt, lte: now },
          status: { not: "CANCELED" }
        }
      });

      const canceledOrders = await prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: openedAt, lte: now },
          status: "CANCELED"
        }
      });

      const totalDinheiro = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("dinheiro"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalCartao = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("cart"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalPix = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("pix"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalDelivery = orders.filter((o: any) => o.orderType === "DELIVERY" || o.deliveryType === "DELIVERY").length;
      const totalComandas = orders.filter((o: any) => o.orderType === "DINING_IN").length;
      const totalGeral = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);

      const withdrawals = cashier.withdrawals ? JSON.parse(cashier.withdrawals) : [];
      const totalWithdrawals = withdrawals.reduce((s: number, w: any) => s + (w.amount || 0), 0);

      const totalDeliveryFeesDinheiro = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("dinheiro"))
        .reduce((s: number, o: any) => s + (o.deliveryFee || 0), 0);

      const totalDeliveryFees = orders.reduce((s: number, o: any) => s + (o.deliveryFee || 0), 0);

      const report = {
        openedAt: cashier.openedAt,
        closedAt: now.toISOString(),
        openingBalance: cashier.openingBalance,
        totalOrders: orders.length,
        canceledOrders: canceledOrders.length,
        totalDinheiro,
        totalCartao,
        totalPix,
        totalDelivery,
        totalComandas,
        totalGeral,
        totalDeliveryFeesDinheiro,
        totalDeliveryFees,
        withdrawals,
        totalWithdrawals,
        totalLiquido: totalGeral - totalWithdrawals - totalDeliveryFees
      };

      const updated = await (prisma as any).cashiersession.update({
        where: { id: cashier.id },
        data: {
          status: "CLOSED",
          closedAt: now,
          closingNotes: closingNotes || null,
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ cashier: updated, report });
    }

    if (action === "PREVIEW") {
      const cashier = await (prisma as any).cashiersession.findFirst({
        where: { storeId: store.id, status: "OPEN" },
        orderBy: { openedAt: "desc" }
      });
      if (!cashier) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

      const openedAt = new Date(cashier.openedAt);
      const now = new Date();

      const orders = await prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: openedAt, lte: now },
          status: { not: "CANCELED" }
        }
      });

      const canceledOrders = await prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: openedAt, lte: now },
          status: "CANCELED"
        }
      });

      const totalDinheiro = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("dinheiro"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalCartao = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("cart"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalPix = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("pix"))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const totalDelivery = orders.filter((o: any) => o.orderType === "DELIVERY" || o.deliveryType === "DELIVERY").length;
      const totalComandas = orders.filter((o: any) => o.orderType === "DINING_IN").length;
      const totalGeral = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);

      const withdrawals = cashier.withdrawals ? JSON.parse(cashier.withdrawals) : [];
      const totalWithdrawals = withdrawals.reduce((s: number, w: any) => s + (w.amount || 0), 0);

      const totalDeliveryFeesDinheiro = orders
        .filter((o: any) => o.paymentMethod?.toLowerCase().includes("dinheiro"))
        .reduce((s: number, o: any) => s + (o.deliveryFee || 0), 0);

      const totalDeliveryFees = orders.reduce((s: number, o: any) => s + (o.deliveryFee || 0), 0);

      const report = {
        openedAt: cashier.openedAt,
        closedAt: now.toISOString(),
        openingBalance: cashier.openingBalance,
        totalOrders: orders.length,
        canceledOrders: canceledOrders.length,
        totalDinheiro,
        totalCartao,
        totalPix,
        totalDelivery,
        totalComandas,
        totalGeral,
        totalDeliveryFeesDinheiro,
        totalDeliveryFees,
        withdrawals,
        totalWithdrawals,
        totalLiquido: totalGeral - totalWithdrawals - totalDeliveryFees
      };

      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("CASHIER_POST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
