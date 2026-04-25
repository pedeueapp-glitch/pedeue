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

    await (prisma as any).option.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}

