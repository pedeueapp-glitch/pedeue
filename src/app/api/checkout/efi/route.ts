import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixImmediateCharge } from "@/lib/efi";

export async function POST(req: NextRequest) {
  try {
    const { planId, storeId, customer, months = 1 } = await req.json();

    if (!planId || !storeId || !customer) {
      return NextResponse.json({ error: "Dados incompletos para o checkout." }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (!plan || !store) {
      return NextResponse.json({ error: "Plano ou Loja não encontrados." }, { status: 404 });
    }

    // Calcular valor com descontos
    let finalAmount = plan.price * months;
    if (months === 3) finalAmount = (plan.price * 3) * 0.9;
    else if (months === 6) finalAmount = (plan.price * 6) * 0.8;
    else if (months === 12) finalAmount = (plan.price * 12) * 0.7;
    else if (months === 24) finalAmount = (plan.price * 24) * 0.6;

    // Criar cobrança na Efí
    const charge = await createPixImmediateCharge({
      amount: finalAmount,
      description: `Assinatura PedeUe - Plano ${plan.name} (${months} meses)`,
      customer: {
        name: customer.name,
        document: customer.document
      }
    });

    // Registrar transação no histórico
    await (prisma as any).platform_transaction.create({
      data: {
        storeId: store.id,
        planId: planId,
        amount: finalAmount,
        months: months,
        status: "pending",
        paymentMethod: "pix",
        externalId: charge.txid
      }
    });

    // Salvar o TXID no banco de dados para conciliação posterior no webhook
    // Usamos upsert para criar a assinatura caso o lojista ainda não tenha uma
    await (prisma as any).subscription.upsert({
      where: { storeId: store.id },
      update: {
        lastPaymentId: charge.txid,
        pendingPlanId: planId,
        status: "TRIALING"
      },
      create: {
        storeId: store.id,
        planId: planId,
        lastPaymentId: charge.txid,
        pendingPlanId: planId,
        status: "TRIALING",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expiração curta enquanto aguarda pagamento
      }
    });

    return NextResponse.json({
      success: true,
      pixCopyPaste: charge.pixCopyPaste,
      pixImage: charge.pixImage,
      txid: charge.txid
    });

  } catch (error: any) {
    console.error("CHECKOUT EFI ERROR:", error);
    
    // Se for erro de CPF da Efí, retornar mensagem amigável
    if (error.nome === 'valor_invalido' && error.mensagem.includes('CPF')) {
      return NextResponse.json({ error: "O CPF informado é inválido para a Efí. Verifique suas configurações." }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao processar pagamento via Pix." }, { status: 500 });
  }
}
