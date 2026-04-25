export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const { items } = await req.json();
    if (!items || items.length === 0) return NextResponse.json({ error: "Nenhum item enviado" }, { status: 400 });

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder || existingOrder.storeId !== store.id) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const newItemsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        total: { increment: newItemsTotal },
        items: {
          create: items.map((item: any) => ({
            id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            choices: item.choices ? (typeof item.choices === 'string' ? item.choices : JSON.stringify(item.choices)) : null
          }))
        },
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true,
        waiter: true
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("ERRO AO ADICIONAR ITENS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
