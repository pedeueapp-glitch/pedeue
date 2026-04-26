export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const affiliate = await prisma.platform_affiliate.findUnique({
      where: { userId: session.user.id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const stores = await prisma.store.findMany({
      where: { platformAffiliateId: affiliate.id },
      include: {
        subscription: {
          select: { status: true, expiresAt: true, plan: { select: { name: true, price: true } } },
        },
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("[AFILIADO/CLIENTES]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
