export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

import { getCurrentStore } from "@/lib/get-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryStoreId = searchParams.get("storeId");
    
    let store: any = null;

    if (queryStoreId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded: any = verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret");
          if (decoded.storeId === queryStoreId) {
            store = await prisma.store.findUnique({ where: { id: queryStoreId } });
          }
        } catch (err) {}
      }
      
      if (!store) {
        store = await getCurrentStore();
      }
    } else {
      store = await getCurrentStore();
    }

    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const products = await (prisma.product as any).findMany({
      where: { 
        storeId: store.id,
        productType: store.storeType
      },
      include: { 
        category: true,
        optiongroup: {
          include: {
            option: true
          }
        }
      },
      orderBy: [{ categoryId: "asc" }, { position: "asc" }],
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("PRODUCTS_GET_ERROR:", error);
    return NextResponse.json({ error: "Erro interno ao reordenar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStore();
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const body = await req.json();
    const { name, description, price, salePrice, imageUrl, categoryId, isActive, inStock, barcode, isCombo, comboConfig, isBestSeller, isFavorite } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios" },
        { status: 400 }
      );
    }

    const lastProduct = await (prisma.product as any).findFirst({
      where: { categoryId },
      orderBy: { position: "desc" },
    });

    const parsedPrice = parseFloat(String(price).replace(',', '.'));
    const parsedSalePrice = salePrice ? parseFloat(String(salePrice).replace(',', '.')) : null;

    if (isNaN(parsedPrice)) {
        return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }

    const product = await (prisma.product as any).create({
      data: {
        id: `prod_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name,
        description,
        price: parsedPrice,
        salePrice: isNaN(parsedSalePrice as any) ? null : parsedSalePrice,
        imageUrl,
        category: { connect: { id: categoryId } },
        store: { connect: { id: store.id } },
        isActive: isActive ?? true,
        inStock: inStock ?? true,
        barcode: barcode || null,
        isCombo: isCombo ?? false,
        comboConfig: comboConfig || null,
        productType: store.storeType,
        position: (lastProduct?.position ?? 0) + 1,
        purchasePrice: body.purchasePrice ? parseFloat(String(body.purchasePrice).replace(',', '.')) : 0,
        profitMargin: body.profitMargin ? parseFloat(String(body.profitMargin).replace(',', '.')) : 0,
        isBestSeller: isBestSeller ?? false,
        isFavorite: isFavorite ?? false,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("PRODUCTS_POST_ERROR:", error);
    return NextResponse.json({ error: "Erro interno ao deletar produto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const deleted = await (prisma.product as any).deleteMany({ 
      where: { id, storeId: store.id } 
    });

    if (deleted.count === 0) return NextResponse.json({ error: "Produto não encontrado ou sem permissão" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PRODUCTS_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir produto" }, { status: 500 });
  }
}
