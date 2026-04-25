export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getCurrentStore } from "@/lib/get-store";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStore();
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { product: true }
        }
      }
    });

    // Filtragem manual para evitar erro de tipo no build enquanto o schema sincroniza
    const currentType = store.storeType || "RESTAURANT";
    // @ts-ignore
    const filteredCategories = categories.filter((cat: any) => cat.storeType === currentType);

    return NextResponse.json(filteredCategories);
  } catch (error: any) {
    console.error("CATEGORIES_GET_ERROR:", error);
    return NextResponse.json({ error: "Erro ao buscar categorias: " + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStore();
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const body = await req.json();
    const { name, emoji } = body;

    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

    const lastCategory = await prisma.category.findFirst({
      where: { storeId: store.id },
      orderBy: { position: "desc" }
    });

    const category = await prisma.category.create({
      data: {
        id: `cat_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name,
        emoji,
        position: lastCategory ? lastCategory.position + 1 : 0,
        storeId: store.id,
        // @ts-ignore
        storeType: store.storeType || "RESTAURANT",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("CATEGORIES_POST_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const body = await req.json();
      const { id, name, emoji } = body;
  
      const updated = await prisma.category.update({
        where: { id },
        data: { name, emoji }
      });
  
      return NextResponse.json(updated);
    } catch (error: any) {
      console.error("CATEGORIES_PATCH_ERROR:", error);
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { categories } = body; 

        if (!Array.isArray(categories)) {
            return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
        }

        for (const cat of categories) {
            await prisma.category.update({
                where: { id: cat.id },
                data: { position: cat.position }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("CATEGORIES_BULK_ORDER_ERROR:", error);
        return NextResponse.json({ error: "Erro ao reordenar: " + error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    // Verificar se existem produtos vinculados
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json({ 
        error: "Exclua os produtos desta categoria antes de removê-la." 
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CATEGORIES_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir categoria" }, { status: 500 });
  }
}
