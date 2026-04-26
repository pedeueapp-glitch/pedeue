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

    const commission = await prisma.affiliate_commission.update({
      where: { id },
      data: {
        status: "PAID",
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
