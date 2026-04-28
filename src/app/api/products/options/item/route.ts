export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { groupId, name, price } = await req.json();

    if (!groupId || !name) {
      return NextResponse.json({ error: "Grupo e nome são obrigatórios" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Verificar se o grupo pertence a um produto desta loja
    const group = await (prisma as any).optiongroup.findFirst({
      where: { 
        id: groupId,
        product: { storeId: store.id }
      }
    });

    if (!group) return NextResponse.json({ error: "Grupo de opções não encontrado ou sem permissão" }, { status: 404 });

    const option = await (prisma as any).option.create({
      data: {
        id: `opti_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        optionGroupId: groupId,
        name,
        price: parseFloat(String(price)) || 0,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(option);
  } catch (error: any) {
    console.error("ERRO AO CRIAR ITEM DE OPÇÃO:", error.message);
    return NextResponse.json({ error: "Erro ao criar item: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: (session.user as any).id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Deletar apenas se o item pertencer a um grupo da loja
    const deleted = await (prisma as any).option.deleteMany({
      where: {
        id,
        optiongroup: {
          product: { storeId: store.id }
        }
      }
    });

    if (deleted.count === 0) return NextResponse.json({ error: "Item não encontrado ou sem permissão" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, price, isActive } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: (session.user as any).id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const updated = await (prisma as any).option.updateMany({
      where: {
        id,
        optiongroup: {
          product: { storeId: store.id }
        }
      },
      data: {
        name: name ?? undefined,
        price: price !== undefined ? parseFloat(String(price)) : undefined,
        isActive: isActive ?? undefined,
        updatedAt: new Date()
      }
    });

    if (updated.count === 0) return NextResponse.json({ error: "Item não encontrado ou sem permissão" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH OPTION ITEM ERROR:", error.message);
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}

