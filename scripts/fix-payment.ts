import { prisma } from "../src/lib/prisma";

async function fix(txid: string) {
  console.log(`Buscando transação ${txid}...`);
  
  const transaction = await (prisma as any).platform_transaction.findUnique({
    where: { externalId: txid }
  });

  if (!transaction) {
    console.error("Transação não encontrada");
    return;
  }

  if (transaction.status === "paid") {
    console.log("Transação já está paga.");
    return;
  }

  console.log("Confirmando transação e atualizando assinatura...");
  
  await (prisma as any).platform_transaction.update({
    where: { id: transaction.id },
    data: { status: "paid" }
  });

  const subscription = await prisma.subscription.findFirst({
    where: { storeId: transaction.storeId }
  });

  if (subscription) {
    const monthsToAdd = (transaction as any).months || 1;
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
    console.log("SUCESSO! Assinatura atualizada.");
  }
}

const txid = process.argv[2];
if (!txid) {
  console.error("Uso: npx tsx scripts/fix-payment.ts <TXID>");
} else {
  fix(txid).catch(console.error);
}
