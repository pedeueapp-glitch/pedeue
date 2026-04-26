import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const affiliate = await prisma.platform_affiliate.findUnique({
      where: { userId: session.user.id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ 
      name: affiliate.name,
      email: affiliate.email,
      pixKey: affiliate.pixKey || "",
    });
  } catch (error) {
    console.error("[AFILIADO/CONFIG GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { name, pixKey, password } = data;

    const affiliate = await prisma.platform_affiliate.findUnique({
      where: { userId: session.user.id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    // Atualiza nome no User e PlatformAffiliate
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    // Atualiza Senha no User
    if (password && password.trim().length >= 8) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });
    }

    // Atualiza platform_affiliate
    await prisma.platform_affiliate.update({
      where: { id: affiliate.id },
      data: {
        name: name || affiliate.name,
        pixKey: pixKey !== undefined ? pixKey : affiliate.pixKey,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Configurações atualizadas." });
  } catch (error) {
    console.error("[AFILIADO/CONFIG PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
