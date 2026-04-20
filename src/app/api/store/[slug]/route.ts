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

    // Remove dados sensíveis
    const { userId, ...safeStore } = store;
    return NextResponse.json(safeStore);
  } catch (error: any) {
    console.error("PUBLIC_SHOP_DATA_ERROR:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}
