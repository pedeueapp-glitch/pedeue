import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        maxProducts: body.maxProducts !== undefined ? parseInt(body.maxProducts) : undefined,
        isActive: body.isActive,
        features: body.features !== undefined ? JSON.stringify(body.features) : undefined,
      }
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if there are active subscriptions before deleting
    const hasSubscribers = await prisma.subscription.findFirst({
        where: { planId: id, status: "ACTIVE" }
    });

    if (hasSubscribers) {
        return NextResponse.json({ error: "Não é possível remover um plano que possui assinantes ativos. Tente apenas desativá-lo." }, { status: 400 });
    }

    await prisma.plan.delete({ where: { id } });

    return NextResponse.json({ message: "Plano removido com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
