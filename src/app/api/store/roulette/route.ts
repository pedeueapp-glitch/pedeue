import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
    select: { rouletteConfig: true }
  });

  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  try {
    const config = store.rouletteConfig ? JSON.parse(store.rouletteConfig) : {
      active: false,
      minOrderValue: 50,
      options: [
        { label: "10% de Desconto", value: "10", type: "PERCENT", weight: 10, color: "#f97316" },
        { label: "Taxa Grátis", value: "0", type: "FREE_DELIVERY", weight: 5, color: "#3b82f6" },
        { label: "Não foi dessa vez", value: "0", type: "LOSE", weight: 50, color: "#94a3b8" },
      ]
    };
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ active: false, options: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  
  const store = await prisma.store.findUnique({
    where: { userId: session.user.id }
  });

  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  await prisma.store.update({
    where: { id: store.id },
    data: {
      rouletteConfig: JSON.stringify(body)
    }
  });

  return NextResponse.json({ success: true });
}
