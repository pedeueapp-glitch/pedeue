import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    
    let decoded: any;
    try {
      decoded = verify(token, secret);
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { tableId, waiterId, storeId, items, observations } = await req.json();

    if (decoded.storeId !== storeId || decoded.id !== waiterId) {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const totalItems = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

    // 1. Procurar pedido aberto para esta mesa
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        storeId,
        status: { notIn: ['DONE', 'CANCELED'] }
      }
    });

    if (existingOrder) {
      // 2. Atualizar pedido existente
      const updatedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          total: { increment: totalItems },
          subtotal: { increment: totalItems },
          updatedAt: new Date(),
          items: {
            create: items.map((item: any) => ({
              id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes
            }))
          }
        }
      });
      return NextResponse.json(updatedOrder);
    }

    // 3. Criar novo pedido
    const order = await prisma.order.create({
      data: {
        id: `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        customerName: "Consumo Local",
        customerPhone: "00000000000",
        orderType: "DINING_IN",
        deliveryType: "PICKUP",
        status: "PREPARING",
        tableId,
        waiterId,
        total: totalItems,
        subtotal: totalItems,
        discount: 0,
        deliveryFee: 0,
        paymentMethod: "PENDENTE",
        observations,
        storeId,
        items: {
          create: items.map((item: any) => ({
            id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("WAITER_ORDER_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
