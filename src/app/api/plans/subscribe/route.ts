export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId } = body;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id }
    });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Atualiza ou cria a assinatura
    await prisma.subscription.upsert({
      where: { storeId: store.id },
      update: { 
        planId: plan.id,
        updatedAt: new Date()
      },
      create: {
        storeId: store.id,
        planId: plan.id,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias se for novo
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SUBSCRIBE_ERROR:", error);
    return NextResponse.json({ error: "Erro ao processar assinatura" }, { status: 500 });
  }
}
