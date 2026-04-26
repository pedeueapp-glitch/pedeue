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

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("[SUPERADMIN/AFILIADOS PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
