import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendRecoveryEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 to prevent email enumeration, but don't send email
      return NextResponse.json({ success: true, message: "Se o e-mail existir em nossa base, um link de recuperação foi enviado." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET || "default_secret_key",
      { expiresIn: "1h" }
    );

    await sendRecoveryEmail(user.email, token);

    return NextResponse.json({ success: true, message: "E-mail de recuperação enviado com sucesso." });
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ error: "Ocorreu um erro interno ao solicitar a recuperação." }, { status: 500 });
  }
}
