import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest) {
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

    if (!affiliate.pixKey) {
      return NextResponse.json({ error: "Você precisa configurar sua chave PIX nas configurações antes de solicitar um saque." }, { status: 400 });
    }

    // Buscar comissões pendentes
    const pendingCommissions = await prisma.affiliate_commission.findMany({
      where: { 
        platformAffiliateId: affiliate.id,
        status: "PENDING"
      },
    });

    if (pendingCommissions.length === 0) {
      return NextResponse.json({ error: "Não há comissões disponíveis para saque." }, { status: 400 });
    }

    // Marcar como solicitadas
    await prisma.affiliate_commission.updateMany({
      where: {
        platformAffiliateId: affiliate.id,
        status: "PENDING"
      },
      data: {
        status: "REQUESTED",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Saque solicitado com sucesso." });
  } catch (error) {
    console.error("[AFILIADO/SAQUE]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
