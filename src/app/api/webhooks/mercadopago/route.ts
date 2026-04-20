import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    if (topic === "payment") {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: id! });

      if (paymentData.status === "approved") {
        const { store_id, plan_id } = paymentData.metadata;

        // Atualizar transação
        await prisma.platform_transaction.update({
          where: { externalId: paymentData.preference_id },
          data: { 
            status: "approved",
            paymentMethod: paymentData.payment_method_id
          }
        });

        // Atualizar assinatura (Adicionar 30 dias)
        const currentSub = await prisma.subscription.findUnique({
          where: { storeId: store_id }
        });

        let newExpiresAt = new Date();
        if (currentSub && currentSub.expiresAt > new Date()) {
          newExpiresAt = new Date(currentSub.expiresAt);
        }
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);

        await prisma.subscription.update({
          where: { storeId: store_id },
          data: {
            planId: plan_id,
            status: "ACTIVE",
            expiresAt: newExpiresAt,
            lastPaymentAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
