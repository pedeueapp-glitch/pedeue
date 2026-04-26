export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — marcar comissão como paga / atualizar dados do afiliado
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { action, ...data } = await req.json();
    const { id } = await params;

    if (action === "toggle") {
      const affiliate = await prisma.platform_affiliate.update({
        where: { id },
        data: { isActive: data.isActive, updatedAt: new Date() },
      });
      return NextResponse.json({ affiliate });
    }

    if (action === "update") {
      const affiliate = await prisma.platform_affiliate.update({
        where: { id },
        data: {
          pixKey: data.pixKey,
          pixKeyType: data.pixKeyType,
          commissionRate: data.commissionRate,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ affiliate });
    }

    if (action === "approve_withdrawal") {
      // 1. Buscar o afiliado e as comissões REQUESTED
      const affiliate = await prisma.platform_affiliate.findUnique({
        where: { id },
        include: {
          commissions: {
            where: { status: "REQUESTED" }
          }
        }
      });

      if (!affiliate || affiliate.commissions.length === 0) {
        return NextResponse.json({ error: "Nenhuma solicitação de saque encontrada para este afiliado." }, { status: 404 });
      }

      if (!affiliate.pixKey) {
        return NextResponse.json({ error: "O afiliado não possui uma chave PIX cadastrada." }, { status: 400 });
      }

      const totalAmount = affiliate.commissions.reduce((acc, c) => acc + c.amount, 0);

      if (totalAmount <= 0) {
        return NextResponse.json({ error: "Valor de saque inválido." }, { status: 400 });
      }

      // 2. Tentar realizar o PIX via Efí
      // Importante: Isso requer que o Superadmin tenha saldo na Efí e escopos de envio ativos.
      try {
        const { sendPixOutbound } = await import("@/lib/efi");
        const efiResponse = await sendPixOutbound({
          amount: totalAmount,
          pixKey: affiliate.pixKey,
          pixKeyType: affiliate.pixKeyType || undefined,
          description: `Pagamento de Comissao PedeUe - ${affiliate.name}`
        });

        console.log(`PIX ENVIADO COM SUCESSO - Afiliado: ${affiliate.name}, Valor: ${totalAmount}, EfiID: ${efiResponse.id || 'N/A'}`);
        
        // 3. Se deu certo na Efí, marcamos no banco como PAID
        const updated = await prisma.affiliate_commission.updateMany({
          where: { platformAffiliateId: id, status: "REQUESTED" },
          data: { 
            status: "PAID", 
            paidAt: new Date(), 
            updatedAt: new Date(),
            // Podemos salvar o ID da transação da Efí se necessário, mas o schema atual não tem esse campo específico por comissão individual (já que é um lote)
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: `PIX de R$ ${totalAmount.toFixed(2)} enviado e saques aprovados.`,
          count: updated.count,
          efiId: efiResponse.id
        });

      } catch (efiError: any) {
        console.error("ERRO AO ENVIAR PIX VIA EFI:", efiError);
        
        // Se a Efí retornar erro de saldo ou permissão, avisamos o admin sem alterar o banco
        const errorMessage = efiError?.mensagem || efiError?.error_description || "Erro desconhecido na API da Efí.";
        return NextResponse.json({ 
          error: `Falha na transferência bancária: ${errorMessage}. Verifique seu saldo e permissões na Efí.` 
        }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("[SUPERADMIN/AFILIADOS PATCH CRITICAL ERROR]:", error);
    return NextResponse.json({ 
      error: "Erro interno ao processar a solicitação", 
      details: error.message || "Erro desconhecido" 
    }, { status: 500 });
  }
}
