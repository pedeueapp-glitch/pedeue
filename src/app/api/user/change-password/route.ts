import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await (prisma as any).user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso!" });

  } catch (error: any) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
  }
}
