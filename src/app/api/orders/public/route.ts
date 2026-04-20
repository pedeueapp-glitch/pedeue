import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items, 
      storeId, 
      customer, 
      deliveryType, 
      deliveryArea,
      paymentMethod,
      change,
      observations 
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone) {
       return NextResponse.json({ error: "Dados do cliente incompletos" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryType === "DELIVERY" ? (deliveryArea?.fee || 0) : 0;
    const total = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        id: `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        deliveryType,
        street: customer.street || null,
        number: customer.number || null,
        complement: customer.complement || null,
        neighborhood: deliveryArea?.neighborhood || customer.neighborhood || null,
        reference: customer.reference || null,
        deliveryFee,
        paymentMethod,
        change: (paymentMethod === "dinheiro" && change) ? parseFloat(change) : null,
        observations: observations || null,
        total,
        storeId,
        customerId: customer.id || null, // Pode ser null se houve erro no cadastro previo
        items: {
          create: items.map((item: any) => ({
            id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
            choices: item.choices ? JSON.stringify(item.choices) : null
          }))
        },
        updatedAt: new Date()
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("ORDER_CREATE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
