import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        subscription: true,
        deliveryarea: true,
        category: {
          where: { isActive: true },
          include: {
            product: {
              where: { isActive: true },
              include: {
                optiongroup: {
                  include: {
                    option: true
                  }
                },
                variants: {
                  orderBy: { createdAt: "asc" }
                }
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    // VERIFICAÇÃO DE ASSINATURA
    const isExpired = store.subscription ? new Date(store.subscription.expiresAt) < new Date() : true;
    if (isExpired) {
      return NextResponse.json({ 
        error: "Assinatura expirada", 
        isExpired: true,
        storeName: store.name
      }, { status: 403 });
    }

    // Remove dados sensíveis e parseia variantes
    const { userId, ...safeStore } = store;
    
    // Parseia os sizes das variantes de string JSON para array
    const storeWithParsedVariants = {
      ...safeStore,
      category: safeStore.category.map(cat => ({
        ...cat,
        product: cat.product.map((p: any) => ({
          ...p,
          variants: (p.variants || []).map((v: any) => ({
            ...v,
            sizes: (() => { try { return JSON.parse(v.sizes || "[]"); } catch { return []; } })()
          }))
        }))
      }))
    };

    return NextResponse.json(storeWithParsedVariants);
  } catch (error: any) {
    console.error("PUBLIC_SHOP_DATA_ERROR:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}
