export const dynamic = 'force-dynamic';
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
      observations,
      affiliateCode,
      upsellRuleId
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone) {
       return NextResponse.json({ error: "Dados do cliente incompletos" }, { status: 400 });
    }

    let affiliateId: string | null = null;
    if (affiliateCode) {
       const aff = await prisma.affiliate.findUnique({
          where: { code_storeId: { code: affiliateCode, storeId } }
       });
       if (aff) affiliateId = aff.id;
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryType === "DELIVERY" ? (deliveryArea?.fee || 0) : 0;
    const total = subtotal + deliveryFee;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const productIds = items.map((item: any) => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId }
    });

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Carrinho inválido" }, { status: 400 });
    }

    let resolvedCustomerId: string | null = null;
    if (customer?.phone) {
      try {
        const upsertedCustomer = await prisma.customer.upsert({
          where: { phone_storeId: { phone: customer.phone, storeId } },
          update: { name: customer.name },
          create: {
            id: customer.id || `cust_${Date.now()}`,
            name: customer.name,
            phone: customer.phone,
            storeId,
            updatedAt: new Date(),
          }
        });
        resolvedCustomerId = upsertedCustomer.id;
      } catch (e) {}
    }

    const order = await prisma.order.create({
      data: {
        customerName: customer.name,
        customerPhone: customer.phone,
        deliveryType,
        orderType: store.storeType === "RESTAURANT" ? (deliveryType === "DELIVERY" ? "DELIVERY" : "PICKUP") : "RETAIL",
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
        customerId: resolvedCustomerId,
        affiliateId,
        upsellRuleId,
        isUpsell: !!upsellRuleId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
            choices: item.choices ? JSON.stringify(item.choices) : null
          }))
        }
      },
      include: {
        items: true
      }
    });
    
    if (upsellRuleId) {
       await prisma.upsell_rule.update({
          where: { id: upsellRuleId },
          data: { timesAccepted: { increment: 1 } }
       }).catch(() => {});
    }

    try {
      const { io } = await import("socket.io-client");
      const socket = io(process.env.WS_SERVER_URL || "http://localhost:3010");
      socket.emit("new-order-trigger", { storeId, order });
      setTimeout(() => socket.disconnect(), 1000);
    } catch (e) {}

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
