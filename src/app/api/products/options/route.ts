import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json([]);

    const groups = await (prisma as any).optiongroup.findMany({
      where: { productId },
      include: { option: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(groups || []);
  } catch (error: any) {
    console.error("ERRO GET OPTIONS:", error.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

    const body = await req.json();
    const { productId, name, minChoices, maxChoices } = body;

    const product = await (prisma as any).product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const group = await (prisma as any).optiongroup.create({
      data: {
        id: `optg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name,
        minOptions: Number(minChoices) || 0,
        maxOptions: Number(maxChoices) || 1,
        isRequired: (Number(minChoices) || 0) > 0,
        productId,
        priceCalculation: "SUM",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("ERRO POST OPTIONS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Verificar se o grupo existe e pertence a um produto desta loja
    const group = await (prisma as any).optiongroup.findFirst({
       where: { 
         id, 
         product: { storeId: store.id } 
       }
    });

    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

    // Excluir em transação: Primeiro os itens, depois o grupo
    await prisma.$transaction(async (tx) => {
      await (tx as any).optionitem.deleteMany({
        where: { groupId: id }
      });

      await (tx as any).optiongroup.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE OPTION GROUP ERROR:", error.message);
    return NextResponse.json({ error: "Erro ao deletar grupo e seus itens" }, { status: 500 });
  }
}
