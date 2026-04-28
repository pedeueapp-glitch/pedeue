export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { name, pixKey, pixKeyType, cpf } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Atualiza o nome do usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name }
    });

    // Atualiza os dados do afiliado
    await prisma.platform_affiliate.update({
      where: { userId: session.user.id },
      data: { 
        pixKey,
        pixKeyType,
        cpf 
      }
    });

    return NextResponse.json({ message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.error("[AFILIADO/PERFIL]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
