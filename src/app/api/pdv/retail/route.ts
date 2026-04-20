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
        where: { storeId: store.id, isActive: true },
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
    const parsedProducts = products.map(p => ({
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
    const { storeId, cart, customerName, customerPhone, paymentMethod, total } = body;

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
        storeId,
        customerName: customerName || "Venda Balcão",
        customerPhone: customerPhone || "",
        paymentMethod,
        total,
        orderType: "RETAIL",
        status: "DONE", // Venda de balcão já sai concluída
        items: {
          create: cart.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.qty,
            unitPrice: item.price,
            optionsText: item.variantText || ""
          }))
        }
      }
    });

    // Subtrair estoque das variantes
    for (const item of cart) {
      if (item.variantId) {
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
