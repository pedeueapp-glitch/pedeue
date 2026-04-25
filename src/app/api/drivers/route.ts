export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("DEBUG - Drivers API Session:", session);
    
    if (!session?.user?.id) {
      console.log("DEBUG - Drivers API: No session or user ID found");
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const drivers = await (prisma as any).driver.findMany({
      where: { storeId: store.id },
      include: {
        _count: {
          select: { order: { where: { status: { in: ["DONE", "DELIVERED"] } } } }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(drivers);
  } catch (error: any) {
    console.error("GET DRIVERS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Faça login novamente" }, { status: 401 });

    const body = await req.json();
    const { name, phone, vehicle } = body;

    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Crie uma loja primeiro" }, { status: 404 });

    // Injeção manual de ID e updatedAt para evitar falhas do Prisma Client
    const driver = await (prisma as any).driver.create({
      data: {
        id: `mot_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
        name: name.trim(),
        phone: phone || "",
        vehicle: vehicle || "",
        storeId: store.id,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(driver);
  } catch (error: any) {
    console.error("POST DRIVER ERROR:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, phone, vehicle } = body;

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const driver = await (prisma as any).driver.update({
      where: { id, storeId: store.id },
      data: {
        name: name?.trim(),
        phone: phone || "",
        vehicle: vehicle || "",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(driver);
  } catch (error: any) {
    console.error("PATCH DRIVER ERROR:", error);
    return NextResponse.json({ error: "Erro ao atualizar: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await (prisma as any).driver.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE DRIVER ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir" }, { status: 500 });
  }
}

