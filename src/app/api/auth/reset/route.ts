import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "default_secret_key");
    } catch (error) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Senha atualizada com sucesso." });
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Ocorreu um erro interno ao redefinir a senha." }, { status: 500 });
  }
}
