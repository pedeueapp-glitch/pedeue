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
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { number, capacity, isActive } = await req.json();

    const table = await prisma.table.update({
      where: { id },
      data: { 
        number: number ? String(number) : undefined, 
        capacity: capacity ? parseInt(capacity) : undefined, 
        isActive 
      }
    });

    return NextResponse.json(table);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar mesa" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;

    await prisma.table.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE TABLE ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir mesa" }, { status: 500 });
  }
}
