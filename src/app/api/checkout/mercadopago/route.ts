import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId, storeId } = body;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });

    // Criar preferência de pagamento no Mercado Pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: plan.id,
            title: `Assinatura SaaS - Plano ${plan.name}`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: 'BRL'
          }
        ],
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
          failure: `${process.env.NEXTAUTH_URL}/dashboard?payment=failure`,
          pending: `${process.env.NEXTAUTH_URL}/dashboard?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.MERCADOPAGO_WEBHOOK_URL || 'https://seu-dominio.com'}/api/webhooks/mercadopago`,
        metadata: {
          store_id: storeId,
          plan_id: planId,
          user_id: session.user.id
        }
      }
    });

    // Registrar transação pendente
    await prisma.platform_transaction.create({
      data: {
        storeId,
        planId,
        amount: plan.price,
        status: "pending",
        externalId: result.id
      }
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error("MP ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
