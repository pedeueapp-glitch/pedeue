import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await req.json();

    // 1. Verificar se o plano existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // 2. Atualizar ou Criar a assinatura da loja
    const subscription = await prisma.subscription.upsert({
      where: { storeId: id },
      update: {
        planId: planId,
        status: "ACTIVE"
      },
      create: {
        storeId: id,
        planId: planId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias se for nova
        status: "ACTIVE"
      }
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("CHANGE_PLAN_ERROR:", error);
    return NextResponse.json({ error: "Erro ao trocar plano" }, { status: 500 });
  }
}
