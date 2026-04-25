import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPixChargeStatus } from "@/lib/efi";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.platform_transaction.findMany({
    include: {
      // Supondo que você queira saber qual loja fez o pagamento
      // Se houver relação no schema, use-a. 
      // Olhando o schema anterior, não há relação explícita mas tem o storeId.
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  // Buscar nomes das lojas para facilitar a visualização
  const transactionsWithStores = await Promise.all(transactions.map(async (t) => {
    const store = await prisma.store.findUnique({
      where: { id: t.storeId },
      select: { name: true }
    });
    return { ...t, storeName: store?.name || 'Desconhecida' };
  }));

  return NextResponse.json({ transactions: transactionsWithStores });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await req.json();

  const transaction = await prisma.platform_transaction.findUnique({
    where: { id }
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (action === "check_status" && transaction.externalId) {
    try {
      const efiStatus = await getPixChargeStatus(transaction.externalId);
      const newStatus = efiStatus.status === "CONCLUIDA" ? "paid" : transaction.status;

      const updated = await prisma.platform_transaction.update({
        where: { id },
        data: { status: newStatus }
      });

      // Se o status mudou para pago, ativar/renovar a assinatura
      if (newStatus === "paid" && transaction.status !== "paid") {
        const currentSub = await prisma.subscription.findUnique({
          where: { storeId: transaction.storeId }
        });

        const now = new Date();
        let baseDate = now;

        // Se a assinatura atual ainda for válida, somamos a partir do final dela
        if (currentSub && currentSub.expiresAt > now) {
          baseDate = new Date(currentSub.expiresAt);
        }

        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + transaction.months);

        await prisma.subscription.update({
          where: { storeId: transaction.storeId },
          data: { 
            status: 'ACTIVE',
            expiresAt: newExpiresAt,
            lastPaymentAt: now,
            lastPaymentId: transaction.id
          }
        });
      }

      return NextResponse.json({ success: true, status: newStatus, efiFullStatus: efiStatus.status });
    } catch (e) {
      console.error("Payment check error:", e);
      return NextResponse.json({ error: "Failed to check status with Efi" }, { status: 500 });
    }
  }

  if (action === "manual_approve") {
    const updated = await prisma.platform_transaction.update({
      where: { id },
      data: { status: "paid" }
    });

    const currentSub = await prisma.subscription.findUnique({
      where: { storeId: transaction.storeId }
    });

    const now = new Date();
    let baseDate = now;

    if (currentSub && currentSub.expiresAt > now) {
      baseDate = new Date(currentSub.expiresAt);
    }

    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + transaction.months);

    await prisma.subscription.update({
      where: { storeId: transaction.storeId },
      data: { 
        status: 'ACTIVE',
        expiresAt: newExpiresAt,
        lastPaymentAt: now,
        lastPaymentId: transaction.id
      }
    });

    return NextResponse.json({ success: true, status: "paid" });
  }


  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
