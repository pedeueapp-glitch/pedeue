import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { categories } = body; // Array of { id: string, position: number }

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Update positions in a transaction
    await prisma.$transaction(
      categories.map((cat: any) =>
        prisma.category.updateMany({
          where: { id: cat.id, storeId: store.id },
          data: { position: cat.position }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("REORDER CATEGORIES ERROR:", error.message);
    return NextResponse.json({ error: "Erro ao reordenar categorias" }, { status: 500 });
  }
}
