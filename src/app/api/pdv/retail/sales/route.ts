import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Listar vendas do tipo RETAIL
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "today"; // today | all

    let dateFilter: any = {};
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateFilter = { createdAt: { gte: today, lt: tomorrow } };
    }

    const sales = await prisma.order.findMany({
      where: {
        storeId: store.id,
        orderType: "RETAIL",
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Calcular totais
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalSales = sales.length;
    const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((si, i) => si + i.quantity, 0), 0);

    return NextResponse.json({ sales, totalRevenue, totalSales, totalItems });
  } catch (error: any) {
    console.error("RETAIL_SALES_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
