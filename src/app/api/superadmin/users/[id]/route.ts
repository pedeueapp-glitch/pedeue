import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();
    
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (id === (session.user as any).id) {
        return NextResponse.json({ error: "Você não pode excluir a sua própria conta." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Usuário removido com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
