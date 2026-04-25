import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const payments = await (prisma as any).platform_transaction.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(payments);

  } catch (error: any) {
    console.error("PAYMENT HISTORY ERROR:", error);
    return NextResponse.json({ error: "Erro ao buscar histórico de pagamentos" }, { status: 500 });
  }
}
