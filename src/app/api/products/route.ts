import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
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
    return NextResponse.json({ error: "Erro ao buscar produtos: " + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const body = await req.json();
    const { name, description, price, imageUrl, categoryId, isActive, inStock } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios" },
        { status: 400 }
      );
    }

    const lastProduct = await prisma.product.findFirst({
      where: { categoryId },
      orderBy: { position: "desc" },
    });

    const product = await prisma.product.create({
      data: {
        id: `prod_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId,
        storeId: store.id,
        isActive: isActive ?? true,
        inStock: inStock ?? true,
        position: (lastProduct?.position ?? 0) + 1,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("PRODUCTS_POST_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PRODUCTS_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir produto" }, { status: 500 });
  }
}
