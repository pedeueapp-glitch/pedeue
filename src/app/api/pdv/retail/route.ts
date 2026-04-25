export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id }
    });

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Buscar produtos com variantes e sessões de caixa abertas
    const [products, cashier] = await Promise.all([
      prisma.product.findMany({
        where: { 
          storeId: store.id, 
          isActive: true,
          productType: store.storeType 
        },
        include: {
          variants: true,
          category: { select: { name: true } }
        }
      }),
      prisma.cashiersession.findFirst({
        where: { storeId: store.id, status: "OPEN" }
      })
    ]);

    // Parseando os arrays de tamanhos
    const parsedProducts = products.map((p: any) => ({
      ...p,
      variants: p.variants.map((v: any) => ({
        ...v,
        sizes: (() => { try { return JSON.parse(v.sizes || "[]"); } catch { return []; } })()
      }))
    }));

    return NextResponse.json({ products: parsedProducts, cashier });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao carregar dados", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { storeId, cart, customerName, customerPhone, paymentMethod, total, discount, subtotal } = body;

    // Verificar caixa
    const openSession = await prisma.cashiersession.findFirst({
      where: { storeId, status: "OPEN" }
    });

    if (!openSession) {
      return NextResponse.json({ error: "Caixa está fechado. Abra o caixa primeiro." }, { status: 400 });
    }

    // Criar o pedido (RETAIL)
    const order = await prisma.order.create({
      data: {
        id: `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        storeId,
        customerName: customerName || "Venda Balcão",
        customerPhone: customerPhone || "",
        paymentMethod,
        total,
        subtotal: subtotal || total,
        discount: discount || 0,
        orderType: "RETAIL",
        status: "DONE",
        updatedAt: new Date(),
        items: {
          create: cart.map((item: any) => ({
            id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            productId: item.productId,
            quantity: item.qty,
            price: item.price,
            choices: JSON.stringify([item.variantText || ""])
          }))
        }
      }
    });

    // Subtrair estoque das variantes
    for (const item of cart) {
      if (item.variantId) {
        // @ts-ignore
        await prisma.product_variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.qty } }
        });
      }
      // Se tiver implementado controle de estoque no produto principal, seria feito aqui.
    }

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    console.error("Venda Retail Erro:", error);
    return NextResponse.json({ error: "Erro ao processar venda", details: error.message }, { status: 500 });
  }
}

