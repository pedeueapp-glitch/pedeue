import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook para notificações de Pix da Efí
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // A Efí envia um array de 'pix' no corpo da requisição
    const payments = body.pix;

    if (!payments || !Array.isArray(payments)) {
      // Pode ser apenas um teste de configuração da Efí
      return NextResponse.json({ ok: true });
    }

    for (const payment of payments) {
      const { txid } = payment;

      if (txid) {
        // 1. Atualizar a transação no histórico
        const transaction = await (prisma as any).platform_transaction.findUnique({
          where: { externalId: txid }
        });

        if (transaction && transaction.status === "pending") {
          await (prisma as any).platform_transaction.update({
            where: { id: transaction.id },
            data: { status: "paid" }
          });

          // 2. Buscar a assinatura vinculada
          const subscription = await prisma.subscription.findFirst({
            where: { storeId: transaction.storeId }
          });

          if (subscription) {
            const monthsToAdd = (transaction as any).months || 1;
            
            // Calcular nova data de expiração
            let currentExpiration = subscription.expiresAt && new Date(subscription.expiresAt) > new Date() 
              ? new Date(subscription.expiresAt) 
              : new Date();
            
            const newExpiration = new Date(currentExpiration);
            newExpiration.setMonth(newExpiration.getMonth() + monthsToAdd);

            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: "ACTIVE",
                planId: transaction.planId,
                pendingPlanId: null,
                expiresAt: newExpiration,
                lastPaymentAt: new Date(),
                updatedAt: new Date()
              }
            });

            console.log(`PAGAMENTO CONFIRMADO: TxID ${txid} - Assinatura renovada por ${monthsToAdd} meses.`);

            // Gerar comissão para o afiliado, se existir
            const { generateAffiliateCommission } = await import("@/lib/affiliateCommission");
            await generateAffiliateCommission(transaction.id, transaction.storeId, transaction.amount);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("WEBHOOK EFI ERROR:", error);
    return NextResponse.json({ error: "Erro ao processar webhook." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
