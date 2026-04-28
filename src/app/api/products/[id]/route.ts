export const dynamic = 'force-dynamic';
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

    const parsedPrice = parseFloat(String(data.price).replace(',', '.'));
    const parsedSalePrice = data.salePrice ? parseFloat(String(data.salePrice).replace(',', '.')) : null;

    if (isNaN(parsedPrice)) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }

    // Usando cast para 'any' para evitar erros de tipo se o Prisma Client estiver desatualizado
    const product = await (prisma.product as any).update({
      where: { id, storeId: store.id },
      data: {
        name: data.name,
        description: data.description,
        price: parsedPrice,
        salePrice: isNaN(parsedSalePrice as any) ? null : parsedSalePrice,
        imageUrl: data.imageUrl,
        category: { connect: { id: data.categoryId } },
        isActive: data.isActive,
        inStock: data.inStock,
        barcode: data.barcode || null,
        isCombo: data.isCombo ?? false,
        comboConfig: data.comboConfig || null,
        purchasePrice: data.purchasePrice ? parseFloat(String(data.purchasePrice).replace(',', '.')) : 0,
        profitMargin: data.profitMargin ? parseFloat(String(data.profitMargin).replace(',', '.')) : 0,
        isBestSeller: data.isBestSeller ?? false,
        isFavorite: data.isFavorite ?? false,
        updatedAt: new Date()
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

    const product = await (prisma.product as any).findUnique({
      where: { id, storeId: store.id },
      include: {
        optiongroup: true,
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx: any) => {
      // Primeiro deletamos as variantes
      await tx.product_variant.deleteMany({
        where: { productId: id }
      });

      // Como o esquema tem onDelete: Cascade para OptionGroup e Option,
      // ao deletar o produto, eles seriam removidos automaticamente.
      // Mas para garantir a ordem correta e evitar erros de FK:
      
      const groups = await tx.optiongroup.findMany({
        where: { productId: id }
      });

      for (const group of groups) {
        await tx.option.deleteMany({
          where: { optionGroupId: group.id }
        });
      }

      await tx.optiongroup.deleteMany({
        where: { productId: id }
      });

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
