export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const areas = await (prisma as any).deliveryarea.findMany({
      where: { storeId: store.id },
      orderBy: { neighborhood: "asc" }
    });

    return NextResponse.json(areas);
  } catch (error: any) {
    console.error("GET DELIVERY FEES ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Faça login novamente" }, { status: 401 });

    const body = await req.json();
    const { neighborhood, fee } = body;

    if (!neighborhood) return NextResponse.json({ error: "Bairro é obrigatório" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Crie uma loja primeiro" }, { status: 404 });

    const area = await (prisma as any).deliveryarea.create({
      data: {
        id: `area_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
        neighborhood: neighborhood.trim(),
        fee: parseFloat(String(fee).replace(',', '.')),
        storeId: store.id,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(area);
  } catch (error: any) {
    console.error("POST DELIVERY FEE ERROR:", error);
    return NextResponse.json({ error: "Erro: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID vazio" }, { status: 400 });

    await (prisma as any).deliveryarea.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE DELIVERY FEE ERROR:", error);
    return NextResponse.json({ error: "Falha ao remover" }, { status: 500 });
  }
}

