export const dynamic = 'force-dynamic';
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
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const { status, driverId, total, subtotal, discount, paymentMethod } = await req.json();
    
    // Unwrapping params as required by newer Next.js versions
    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) {
       return NextResponse.json({ error: "ID do pedido não fornecido" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    // Primeiro buscamos o pedido pelo ID único
    const existingOrder = await prisma.order.findUnique({
      where: { id: String(orderId) }
    });

    if (!existingOrder || existingOrder.storeId !== store.id) {
       return NextResponse.json({ error: "Pedido não encontrado nesta loja" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: String(orderId) },
      data: { 
        status,
        driverId: driverId || undefined,
        total: total !== undefined ? parseFloat(total) : undefined,
        subtotal: subtotal !== undefined ? parseFloat(subtotal) : undefined,
        discount: discount !== undefined ? parseFloat(discount) : undefined,
        paymentMethod: paymentMethod || undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido não fornecido" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const existingOrder = await prisma.order.findUnique({
      where: { id: String(orderId) }
    });

    if (!existingOrder || existingOrder.storeId !== store.id) {
      return NextResponse.json({ error: "Pedido não encontrado nesta loja" }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id: String(orderId) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao remover pedido:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

