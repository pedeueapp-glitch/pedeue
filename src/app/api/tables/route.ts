import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json([], { status: 200 });

    const tables = await prisma.table.findMany({
      where: { storeId: store.id },
      orderBy: { number: 'asc' }
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("API TABLES GET ERROR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const { number, capacity, isActive } = await req.json();

    const existingTable = await prisma.table.findFirst({
      where: { 
          number: String(number),
          storeId: store.id
      }
    });

    if (existingTable) {
      return NextResponse.json({ error: "Mesa já existe" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        id: `table_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        number: String(number),
        capacity: capacity ? parseInt(capacity) : null,
        isActive: isActive !== undefined ? isActive : true,
        storeId: store.id,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("API TABLES POST ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar mesa" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TABLES_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir mesa" }, { status: 500 });
  }
}
