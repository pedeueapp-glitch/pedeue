import { prisma } from "@/lib/prisma";

/**
 * Gera uma comissão para o afiliado da plataforma quando um pagamento é aprovado.
 * Chamada automaticamente após a confirmação de qualquer `platform_transaction`.
 */
export async function generateAffiliateCommission(
  transactionId: string,
  storeId: string,
  amount: number
) {
  try {
    // Buscar loja e seu afiliado vinculado
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { platformAffiliateId: true, platformAffiliate: true },
    });

    if (!store?.platformAffiliateId || !store.platformAffiliate) return;

    const affiliate = store.platformAffiliate;
    if (!affiliate.isActive) return;

    // Verificar se comissão já foi gerada para essa transação (idempotência)
    const existing = await prisma.affiliate_commission.findFirst({
      where: { platformTransactionId: transactionId },
    });

    if (existing) return; // já gerada, ignora

    const commissionAmount = affiliate.commissionValue;

    await prisma.affiliate_commission.create({
      data: {
        platformAffiliateId: affiliate.id,
        storeId,
        platformTransactionId: transactionId,
        amount: commissionAmount,
        status: "PENDING",
        updatedAt: new Date(),
      },
    });

    console.log(
      `[AFFILIATE COMMISSION] Gerada R$${commissionAmount} para afiliado ${affiliate.name} (transação ${transactionId})`
    );
  } catch (error) {
    // Não deve bloquear o fluxo principal de pagamento
    console.error("[AFFILIATE COMMISSION ERROR]", error);
  }
}
