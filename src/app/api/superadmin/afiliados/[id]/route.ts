export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — marcar comissão como paga / atualizar dados do afiliado
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { action, ...data } = await req.json();
    const { id } = params;

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
          commissionRate: data.commissionRate,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ affiliate });
    }

    if (action === "approve_withdrawal") {
      // Pega todas com status REQUESTED e marca como PAID
      const updated = await prisma.affiliate_commission.updateMany({
        where: { platformAffiliateId: id, status: "REQUESTED" },
        data: { status: "PAID", paidAt: new Date(), updatedAt: new Date() }
      });
      return NextResponse.json({ success: true, count: updated.count });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("[SUPERADMIN/AFILIADOS PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
