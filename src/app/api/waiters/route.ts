export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store || store.storeType !== "RESTAURANT") {
      return NextResponse.json([], { status: 200 });
    }

    const waiters = await prisma.waiter.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(waiters);
  } catch (error: any) {
    console.error("API WAITERS GET ERROR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
  if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

  const { name, phone, isActive, password } = await req.json();

  const waiter = await prisma.waiter.create({
    data: {
      id: `waiter_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      name,
      phone,
      password: password || "", // Salva a senha
      isActive: isActive !== undefined ? isActive : true,
      storeId: store.id,
      updatedAt: new Date()
    }
  });

  return NextResponse.json(waiter);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.waiter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WAITERS_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir garçom" }, { status: 500 });
  }
}

