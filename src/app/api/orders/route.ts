import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
       return NextResponse.json([]); // Retorna array vazio em vez de erro 401 para evitar quebras no .map
    }

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id }
    });

    if (!store) {
       return NextResponse.json([]); // Retorna array vazio se não houver loja
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: { 
        items: {
          include: {
            product: true
          }
        },
        table: true,
        waiter: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json([]); 
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const { status } = body;
    
    // Tenta pegar o ID tanto do body quanto da URL para maior compatibilidade
    const url = new URL(req.url);
    const orderIdFromUrl = url.pathname.split("/").pop();
    const orderId = body.orderId || (orderIdFromUrl !== 'orders' ? orderIdFromUrl : null);

    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido nao fornecido" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const order = await prisma.order.update({
      where: { 
        id: orderId, 
        storeId: store.id 
      },
      data: { status }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Falha na atualização" }, { status: 500 });
  }
}
