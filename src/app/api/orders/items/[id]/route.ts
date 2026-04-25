import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { isCanceled } = await req.json();

    // 1. Buscar o item e o pedido relacionado
    const item = await prisma.orderitem.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    // 2. Verificar se o usuário é dono da loja do pedido
    const store = await prisma.store.findFirst({
      where: { id: item.order.storeId, userId: session.user.id }
    });

    if (!store) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // 3. Atualizar o item
    const updatedItem = await prisma.orderitem.update({
      where: { id },
      data: { isCanceled }
    });

    // 4. Recalcular o total do pedido
    const allItems = await prisma.orderitem.findMany({
      where: { orderId: item.orderId }
    });

    const newTotal = allItems.reduce((acc, curr) => {
      if (curr.isCanceled) return acc;
      return acc + (curr.price * curr.quantity);
    }, 0);

    await prisma.order.update({
      where: { id: item.orderId },
      data: { 
        total: newTotal,
        subtotal: newTotal, // Supondo que subtotal acompanhe o total sem impostos/taxas aqui
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("CANCEL_ITEM_ERROR:", error);
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}
