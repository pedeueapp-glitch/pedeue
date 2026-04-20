import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const product = await prisma.product.update({
      where: { id, storeId: store.id },
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        isActive: data.isActive,
        inStock: data.inStock
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("ERRO PATCH PRODUCT:", error.message);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // 1. Verificar se o produto existe e pertence à loja
    // O Prisma usa os nomes do schema.prisma!
    const product = await (prisma as any).product.findUnique({
      where: { id, storeId: store.id },
      include: {
        optiongroup: true, // Corrigido para minúsculo
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // 2. Tentar deletar em uma transação para garantir integridade
    await prisma.$transaction(async (tx) => {
      // Deletar itens dos opcionais primeiro
      if (product.optiongroup && product.optiongroup.length > 0) {
        for (const group of product.optiongroup) {
            await (tx as any).optionitem.deleteMany({
                where: { groupId: group.id }
            });
        }
        
        // Deletar os grupos de opcionais
        await (tx as any).optiongroup.deleteMany({
          where: { productId: id }
        });
      }

      // Deletar o produto
      await tx.product.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);
    
    if (error.code === 'P2003') {
        return NextResponse.json({ 
            error: "Este produto não pode ser excluído pois já possui histórico de pedidos. Experimente desativá-lo." 
        }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao deletar produto: " + error.message }, { status: 500 });
  }
}
