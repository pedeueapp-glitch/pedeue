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
    const { name, phone, isActive } = await req.json();

    const waiter = await prisma.waiter.update({
      where: { id },
      data: { name, phone, isActive }
    });

    return NextResponse.json(waiter);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar garçom" }, { status: 500 });
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

    await prisma.waiter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE WAITER ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir garçom" }, { status: 500 });
  }
}
