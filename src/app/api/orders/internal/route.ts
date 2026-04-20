import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const { tableId, waiterId, items, paymentMethod, observations } = await req.json();

    // Calculo do total
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const order = await prisma.order.create({
      data: {
        id: `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        customerName: "Consumo Local",
        customerPhone: "00000000000",
        orderType: "DINING_IN",
        deliveryType: "PICKUP", // Para compatibilidade com campos obrigatorios antigos
        status: "PREPARING",
        tableId,
        waiterId,
        total,
        deliveryFee: 0,
        paymentMethod: paymentMethod || "PENDENTE",
        observations,
        storeId: store.id,
        items: {
          create: items.map((item: any) => ({
            id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            choices: item.choices // Se houver opcionais
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

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("ERRO AO CRIAR PEDIDO INTERNO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
