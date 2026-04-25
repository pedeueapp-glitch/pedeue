export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" }
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const plan = await prisma.plan.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        price: parseFloat(data.price),
        maxProducts: parseInt(data.maxProducts),
        description: data.description,
        isActive: true,
        features: JSON.stringify(data.features),
        updatedAt: new Date()
      }
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}

// NOVO: Método de Edição de Planos
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { id, ...updateData } = data;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: updateData.name,
        price: parseFloat(updateData.price),
        maxProducts: parseInt(updateData.maxProducts),
        description: updateData.description,
        features: JSON.stringify(updateData.features),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("EDIT_PLAN_ERROR:", error);
    return NextResponse.json({ error: "Erro ao editar plano" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await prisma.plan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_PLAN_ERROR:", error);
    return NextResponse.json({ error: "Erro ao excluir plano" }, { status: 500 });
  }
}
