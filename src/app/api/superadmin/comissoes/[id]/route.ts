export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — marcar comissão como paga
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { action } = await req.json().catch(() => ({ action: "approve" }));

    // Buscar detalhes da comissão e do afiliado
    const commissionData = await prisma.affiliate_commission.findUnique({
      where: { id },
      include: { platformAffiliate: true }
    });

    if (!commissionData) {
      return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
    }

    // Ação: Checar Status na EFI
    if (action === "check_status") {
        if (!commissionData.efiIdEnvio) {
            return NextResponse.json({ error: "Esta comissão não possui um ID de envio vinculado." }, { status: 400 });
        }

        try {
            const { getPixTransferStatus } = await import("@/lib/efi");
            const efiStatus = await getPixTransferStatus(commissionData.efiIdEnvio);
            
            // Se o status na EFI for 'CONCLUIDO' ou similar que indique sucesso
            const isCompleted = efiStatus.status === "CONCLUIDO" || efiStatus.status === "REALIZADO";

            if (isCompleted && commissionData.status !== "PAID") {
                await prisma.affiliate_commission.update({
                    where: { id },
                    data: {
                        status: "PAID",
                        paidAt: new Date(),
                    }
                });
                return NextResponse.json({ message: "Status atualizado: Pago", efiStatus });
            }

            return NextResponse.json({ message: `Status na EFI: ${efiStatus.status}`, efiStatus });
        } catch (err) {
            return NextResponse.json({ error: "Erro ao consultar EFI", details: String(err) }, { status: 500 });
        }
    }

    if (commissionData.status === "PAID") {
      return NextResponse.json({ error: "Esta comissão já foi paga" }, { status: 400 });
    }

    const affiliate = commissionData.platformAffiliate;

    let efiIdEnvio = commissionData.efiIdEnvio;

    // Ação: Aprovação Automática (Pagar via EFI)
    if (action === "approve") {
        if (!affiliate.pixKey) {
            return NextResponse.json({ error: "Afiliado não possui chave PIX cadastrada" }, { status: 400 });
        }

        try {
            const { sendPixPayment } = await import("@/lib/efi");
            const payRes = await sendPixPayment({
                amount: commissionData.amount,
                pixKey: affiliate.pixKey,
                pixKeyType: affiliate.pixKeyType || "CPF",
                description: `Comissão PedeUe - Ref: ${commissionData.platformTransactionId}`
            });
            efiIdEnvio = payRes.idEnvio;
        } catch (payError) {
            console.error("[EFI AUTO PAYOUT ERROR]", payError);
            return NextResponse.json({ 
                error: "Falha ao processar pagamento via EFI.",
                details: payError instanceof Error ? payError.message : String(payError)
            }, { status: 500 });
        }
    }

    // Ação: Manual Approve (Apenas marca no banco) ou Finalização da Automática
    const commission = await prisma.affiliate_commission.update({
      where: { id },
      data: {
        status: "PAID",
        efiIdEnvio: efiIdEnvio,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ commission });
  } catch (error) {
    console.error("[SUPERADMIN/COMISSOES PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
