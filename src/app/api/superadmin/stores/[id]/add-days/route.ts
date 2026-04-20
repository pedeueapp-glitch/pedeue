import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: storeId } = await params;
    const { days } = await req.json();

    // 1. Verificar se a loja existe e pegar a assinatura
    let store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { subscription: true }
    });

    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    let subscription = store.subscription;

    // 2. Se não tiver assinatura, criar uma inicial vinculada ao primeiro plano ativo
    if (!subscription) {
      const defaultPlan = await prisma.plan.findFirst({ where: { isActive: true } });
      if (!defaultPlan) return NextResponse.json({ error: "Nenhum plano ativo encontrado no sistema para vincular" }, { status: 400 });

      subscription = await prisma.subscription.create({
        data: {
          storeId: storeId,
          planId: defaultPlan.id,
          status: "ACTIVE",
          expiresAt: new Date(), // Começa de agora
        }
      });
    }

    // 3. Calcular a nova data
    let currentExpiry = new Date(subscription.expiresAt);
    const daysInt = parseInt(days);

    // Se estivermos adicionando dias a uma assinatura já VENCIDA, começamos a contar de HOJE
    if (daysInt > 0 && currentExpiry < new Date()) {
      currentExpiry = new Date();
    }
    
    // Aplica o ajuste (seja positivo ou negativo)
    currentExpiry.setDate(currentExpiry.getDate() + daysInt);

    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        expiresAt: currentExpiry,
        status: "ACTIVE"
      }
    });

    return NextResponse.json(updatedSub);
  } catch (error: any) {
    console.error("ADD_DAYS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
