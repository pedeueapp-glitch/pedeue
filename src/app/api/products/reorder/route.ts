import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { products } = body; // Array of { id: string, position: number }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Update positions in a transaction
    await prisma.$transaction(
      products.map((prod: any) =>
        prisma.product.updateMany({
          where: { id: prod.id, storeId: store.id },
          data: { position: prod.position }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("REORDER PRODUCTS ERROR:", error.message);
    return NextResponse.json({ error: "Erro ao reordenar produtos" }, { status: 500 });
  }
}
