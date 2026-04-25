export const dynamic = 'force-dynamic';
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

    const body = await req.json();
    const { tableId, waiterId, items, paymentMethod, observations, orderType, customerId, customerName, customerPhone, deliveryDeadline, total, subtotal, discount } = body;

    const finalTotal = total || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const orderTypeMap: Record<string, any> = {
      SHOWCASE: "RETAIL",
      SERVICE: "SERVICE",
      RESTAURANT: orderType || "DINING_IN"
    };

    const finalOrderType = orderTypeMap[store.storeType] || "DINING_IN";

    // Validação: Impedir abertura de nova comanda se a mesa já estiver ocupada
    if (tableId) {
      const existingActiveOrder = await prisma.order.findFirst({
        where: {
          storeId: store.id,
          tableId: tableId,
          status: {
            in: ["PENDING", "ACCEPTED", "PREPARING", "DELIVERING"]
          }
        }
      });

      if (existingActiveOrder) {
        return NextResponse.json({ error: "Já existe uma comanda aberta para esta mesa." }, { status: 400 });
      }
    }

    const order = await prisma.order.create({
      data: {
        id: `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        customerName: customerName || "Consumo Local",
        customerPhone: customerPhone || "00000000000",
        customerId,
        orderType: finalOrderType,
        deliveryType: "PICKUP", // Para compatibilidade com campos obrigatorios antigos
        status: store.storeType === "SERVICE" ? "PENDING" : "PREPARING",
        tableId,
        waiterId,
        total: finalTotal,
        subtotal: subtotal || finalTotal,
        discount: discount || 0,
        deliveryDeadline: deliveryDeadline ? new Date(deliveryDeadline) : null,
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

