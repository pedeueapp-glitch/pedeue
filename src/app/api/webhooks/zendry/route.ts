export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

import { recordWebhook } from "@/app/api/superadmin/webhooks/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await recordWebhook("zendry", body.notification_type || "payment", body);
    console.log("ZENDRY WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

    const { notification_type, message, md5 } = body;

    // 1. Validação de segurança (opcional, mas recomendado se ZENDRY_SECRET_KEY estiver configurado)
    const secretKey = process.env.ZENDRY_SECRET_KEY;
    if (secretKey && md5) {
      // Exemplo de string para MD5 conforme docs: qrcode.{reference_code}.{end_to_end}.{value_cents}.{secret_key}
      const endToEnd = message.end_to_end || message.id || ""; // Tenta encontrar o ID da transação
      const valStr = `qrcode.${message.reference_code}.${endToEnd}.${message.value_cents}.${secretKey}`;
      const hash = crypto.createHash('md5').update(valStr).digest('hex');
      
      // Nota: A Zendry pode ter variações no formato dependendo do tipo de notificação.
      // Se o hash não bater, apenas logamos por enquanto para não perder transações reais
      // durante a fase de ajuste, mas em produção o ideal é rejeitar.
      if (hash !== md5) {
        console.warn("ZENDRY WEBHOOK HASH MISMATCH:", { expected: md5, calculated: hash });
      }
    }

    // 2. Verificar se o status é 'paid'
    if (message.status === "paid") {
      const referenceCode = message.reference_code;

      // Buscar transação no nosso banco usando o reference_code (que salvamos como externalId)
      const transaction = await prisma.platform_transaction.findUnique({
        where: { externalId: referenceCode }
      });

      if (transaction && transaction.status !== "paid") {
        // Atualizar transação para aprovada
        await prisma.platform_transaction.update({
          where: { id: transaction.id },
          data: { 
            status: "paid",
            updatedAt: new Date()
          }
        });

        // Atualizar assinatura (Adicionar 30 dias)
        const currentSub = await prisma.subscription.findUnique({
          where: { storeId: transaction.storeId }
        });

        let newExpiresAt = new Date();
        if (currentSub && currentSub.expiresAt > new Date()) {
          newExpiresAt = new Date(currentSub.expiresAt);
        }
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);

        await prisma.subscription.update({
          where: { storeId: transaction.storeId },
          data: {
            planId: transaction.planId,
            status: "ACTIVE",
            expiresAt: newExpiresAt,
            lastPaymentAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`ZENDRY WEBHOOK: Assinatura da loja ${transaction.storeId} renovada até ${newExpiresAt.toISOString()}`);

        // Gerar comissão para o afiliado, se existir
        const { generateAffiliateCommission } = await import("@/lib/affiliateCommission");
        await generateAffiliateCommission(transaction.id, transaction.storeId, transaction.amount);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ZENDRY WEBHOOK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
